:- consult(bench).
set_depth(D) :- retractall(engine:max_depth(_)), assertz(engine:max_depth(D)).
main_depth :-
    format("resources,depth,strategy,avg_ms,paths,inferences~n"),
    forall(member(N, [100, 1000]),
      ( format(atom(F), "env_~d.pl", [N]), load_facts(F),
        forall(member(D, [4, 6, 8, 10]),
          ( set_depth(D),
            forall(member(Name-G, [ 'dfs+tabling'-(user:sensitive(A), attack_path(A, _)),
                                    'dfs plain'-(dfs_plain(_, _)),
                                    'bfs'-(user:sensitive(A2), bfs_paths(A2, Ps), member(_, Ps)) ]),
              ( findall(Ms-C-I, (between(1, 3, _), time_goal(G, Ms, C, I)), Rs),
                aggregate_all(sum(M), member(M-_-_, Rs), S), Avg is S / 3,
                Rs = [_-Cnt-Inf | _],
                format("~d,~d,~w,~1f,~w,~d~n", [N, D, Name, Avg, Cnt, Inf]), flush_output )) )) )),
    set_depth(6).
