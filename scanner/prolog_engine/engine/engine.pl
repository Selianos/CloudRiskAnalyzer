/*  engine.pl -- inference engine on top of rules.pl.
    Phase 1: tabled reachability.  Phase 2: depth-limited DFS that lists
    every simple attack path to each sensitive asset.  Phase 3: explain. */

:- module(engine, [load_facts/1, reachable/2, attack_path/2,
                   all_paths/2, explain/1, explain_all/0, max_depth/1,
                   path_nodes/2, path_evidence/2]).
:- use_module(rules).

:- dynamic max_depth/1.
max_depth(6).                       % longest path searched (in steps)

load_facts(File) :-                 % working memory for one scan
    abolish_all_tables,
    maplist(retract_all_pred,
            [resource/3, label/2, open_to_internet/2, uses_network_rule/2,
             instance_identity/2, can_assume/2, allows/3, console_login/1,
             mfa_enabled/1, public_bucket/1, sensitive/1, finding/3]),
    load_files(user:File, [if(true)]).
retract_all_pred(N/A) :- functor(H, N, A), retractall(user:H).

/* ---- Phase 1: reachability with tabling ------------------------------ */
:- table reachable/2.
reachable(X, Y) :- step(X, Y, _, _).
reachable(X, Y) :- reachable(X, Z), step(Z, Y, _, _).

% same relation read backwards: called with the asset bound, so one table
% per asset holds every node that can still reach it
:- table leads_to/2.
leads_to(G, Z) :- step(Z, G, _, _).
leads_to(G, Z) :- leads_to(G, Y), step(Z, Y, _, _).

/* ---- Phase 2: attack path search (depth-limited DFS) ----------------- */
attack_path(Asset, Path) :-
    user:sensitive(Asset),
    reachable(internet, Asset),          % phase 1: skip unreachable assets
    findall(Z, leads_to(Asset, Z), Zs),  % nodes that can still reach Asset
    list_to_assoc_set(Zs, Live),
    max_depth(D),
    dfs(internet, Asset, [internet], Live, D, Path).

dfs(Goal, Goal, _, _, _, []).
dfs(Node, Goal, Visited, Live, D, [step(Node, Next, Rule, Ev) | Rest]) :-
    D > 0,
    step(Node, Next, Rule, Ev),
    \+ memberchk(Next, Visited),          % simple paths only (no cycles)
    ( Next == Goal ; get_assoc(Next, Live, _) ),   % prune dead branches
    D1 is D - 1,
    dfs(Next, Goal, [Next | Visited], Live, D1, Rest).

list_to_assoc_set(Xs, A) :-
    sort(Xs, S), findall(X-t, member(X, S), Ps), list_to_assoc(Ps, A).

all_paths(Asset, Paths) :-
    findall(P, attack_path(Asset, P), Paths).

path_nodes(Path, Nodes) :-
    findall(N, member(step(_, N, _, _), Path), Nodes).

path_evidence(Path, Rs) :-              % resources a path depends on
    findall(R, ( member(step(_, N, _, Ev), Path),
                 ( R = N ; ev_resource(Ev, R) ) ), Rs0),
    sort(Rs0, Rs).
ev_resource(via(Rule, _), Rule).

/* ---- Phase 3: explanation facility ----------------------------------- */
explain(Asset) :-
    all_paths(Asset, Paths),
    length(Paths, N), name_of(Asset, AN),
    format("~w: ~d attack path(s)~n", [AN, N]),
    forall(nth1(I, Paths, P), explain_path(I, P)).

explain_path(I, Path) :-
    length(Path, L),
    format("  Path ~d (~d steps)~n", [I, L]),
    forall(nth1(K, Path, step(F, T, R, Ev)),
           ( name_of(F, FN), name_of(T, TN), rule_text(R, Txt),
             upcase_atom(R, RU), ev_text(Ev, ET),
             format("    ~d. ~w -> ~w  [~w: ~w; ~w]~n",
                    [K, FN, TN, RU, Txt, ET]) )).

explain_all :-
    forall(user:sensitive(A), explain(A)).

name_of(internet, 'Internet') :- !.
name_of(X, N) :- user:label(X, N), !.
name_of(X, X).

ev_text(via(R, P), T)    :- name_of(R, RN),
    format(atom(T), "~w opens port ~w to 0.0.0.0/0", [RN, P]).
ev_text(no_mfa(U), T)    :- name_of(U, UN),
    format(atom(T), "~w has console login and no MFA fact", [UN]).
ev_text(attached(I, R), T) :- name_of(I, IN), name_of(R, RN),
    format(atom(T), "~w runs as ~w", [IN, RN]).
ev_text(trust(P, Q), T)  :- name_of(P, PN), name_of(Q, QN),
    format(atom(T), "~w trusts ~w", [QN, PN]).
ev_text(admin(P), T)     :- name_of(P, PN),
    format(atom(T), "~w has admin on *", [PN]).
ev_text(grants(P, A, B), T) :- name_of(P, PN), name_of(B, BN),
    format(atom(T), "grants(~w, ~w, ~w)", [PN, A, BN]).
ev_text(public(B), T)    :- name_of(B, BN),
    format(atom(T), "~w allows allUsers / Principal *", [BN]).
