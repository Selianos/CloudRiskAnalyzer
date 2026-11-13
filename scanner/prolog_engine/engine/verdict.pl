/*  verdict.pl -- builds the verdict file (INTERFACES.md section 5).
    The re-rating rule here is an interim version; the final one is the
    knowledge engineer's second-opinion module (report section 3.4).     */

:- module(verdict, [write_verdict/3]).
:- use_module(engine).
:- use_module(rules).
:- use_module(library(http/json)).

numbered_paths(Ps) :-
    findall(A-P, attack_path(A, P), APs),
    findall(p(I, A, P), nth1(I, APs, A-P), Ps).

finding_paths(Ps, Res, N) :-
    aggregate_all(count, ( member(p(_, _, P), Ps),
                           path_evidence(P, Rs), memberchk(Res, Rs) ), N).

level(critical, 4). level(high, 3). level(medium, 2). level(low, 1). level(info, 0).
level(warning, 1).

rerate(Orig, N, critical, 'lies on a path from the internet to a sensitive asset') :- N > 0, !, level(Orig, _).
rerate(Orig, 0, New, 'not part of any attack path to a sensitive asset') :-
    level(Orig, L), L1 is max(0, L - 1), level(New, L1), New \== warning, !.

write_verdict(ScanId, Provider, OutFile) :-
    numbered_paths(Ps),
    maplist(path_json, Ps, PathsJ),
    findall(F, finding_json(Ps, F), FindJ),
    aggregate_all(count, user:sensitive(_), NS),
    aggregate_all(count, (user:sensitive(A), reachable(internet, A)), NR),
    length(Ps, NP),
    best_fix(FindJ, Fix),
    D = _{scan_id: ScanId, provider: Provider, engine: 'SWI-Prolog',
          summary: _{sensitive_assets: NS, reachable_assets: NR, attack_paths: NP},
          paths: PathsJ, findings: FindJ, best_fix: Fix},
    setup_call_cleanup(open(OutFile, write, S),
                       json_write_dict(S, D, [width(100)]), close(S)).

path_json(p(I, A, P), _{id: Id, asset: A, length: L, steps: Steps}) :-
    format(atom(Id), "P~d", [I]), length(P, L),
    maplist(step_json, P, Steps).
step_json(step(F, T, R, Ev), _{from: F, to: T, rule: RU, evidence: E}) :-
    upcase_atom(R, RU), format(atom(E), "~q", [Ev]).

finding_json(Ps, _{rule_id: R, resource_id: Res, sahaba_severity: S,
                   prolog_severity: New, paths: N, reason: Why}) :-
    user:finding(R, Res, S),
    finding_paths(Ps, Res, N),
    rerate(S, N, New, Why).

best_fix(FindJ, _{rule_id: R, resource_id: Res, closes_paths: N}) :-
    findall(N0-(R0-Res0),
            ( member(F, FindJ), get_dict(paths, F, N0), N0 > 0,
              get_dict(rule_id, F, R0), get_dict(resource_id, F, Res0) ), L),
    L \== [], !,
    max_member(N-(R-Res), L).
best_fix(_, null).
