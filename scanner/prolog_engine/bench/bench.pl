:- use_module('../engine/engine').
:- use_module('../engine/search_bfs').

dfs_plain(Asset, P) :-                 % DFS with the same limit, no pruning
    user:sensitive(Asset), max_depth(D),
    engine:dfs_np(internet, Asset, [internet], D, P).
engine:dfs_np(G, G, _, _, []).
engine:dfs_np(N, G, V, D, [step(N, M, R, E) | T]) :-
    D > 0, rules:step(N, M, R, E), \+ memberchk(M, V),
    D1 is D - 1, engine:dfs_np(M, G, [M | V], D1, T).

time_goal(G, Ms, Count, Expanded) :-
    abolish_all_tables, garbage_collect,
    statistics(inferences, I0), statistics(cputime, T0),
    catch(call_with_time_limit(120, aggregate_all(count, G, Count)), _, Count = timeout),
    statistics(cputime, T1), statistics(inferences, I1),
    Ms is round((T1 - T0) * 1000), Expanded is I1 - I0.

run(N) :-
    format(atom(F), "env_~d.pl", [N]), load_facts(F),
    aggregate_all(count, user:sensitive(_), NS),
    forall(member(Name-G,
             [ 'dfs+tabling'-(user:sensitive(A), attack_path(A, _)),
               'dfs plain'  -(dfs_plain(_, _)),
               'bfs'        -(user:sensitive(A2), bfs_paths(A2, Ps), member(_, Ps)) ]),
           ( findall(Ms-C-I, (between(1, 5, _), time_goal(G, Ms, C, I)), Rs),
             aggregate_all(sum(M), member(M-_-_, Rs), S), Avg is S / 5,
             Rs = [_-Cnt-Inf | _],
             format("~d,~d,~w,~1f,~w,~d~n", [N, NS, Name, Avg, Cnt, Inf]) )).
main :- format("resources,sensitive,strategy,avg_ms,paths,inferences~n"),
        forall(member(N, [10, 100, 1000]), run(N)).
