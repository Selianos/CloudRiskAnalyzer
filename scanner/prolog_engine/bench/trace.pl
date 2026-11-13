:- use_module('../engine/engine').
% prints every node expansion of the DFS for one asset
:- dynamic n/1.
tdfs(G, G, _, _, _, []) :- !.
tdfs(N, G, V, L, D, [M|T]) :- D > 0, rules:step(N, M, _, _), \+ memberchk(M, V),
    ( M == G -> Tag = goal ; get_assoc(M, L, _) -> Tag = live ; Tag = pruned ),
    engine:name_of(N, NN), engine:name_of(M, MN), retract(n(K)), K1 is K+1, assertz(n(K1)),
    format("~d. ~w -> ~w (~w)~n", [K1, NN, MN, Tag]), Tag \== pruned,
    D1 is D-1, tdfs(M, G, [M|V], L, D1, T).
t :- load_facts('../tests/fixtures/aws-demo.pl'), A = 'customer-data',
     findall(Z, engine:leads_to(A, Z), Zs), engine:list_to_assoc_set(Zs, L),
     retractall(n(_)), assertz(n(0)),
     forall(tdfs(internet, A, [internet], L, 6, P), (engine:maplist(engine:name_of, P, Ns), format("   FOUND ~w~n", [Ns]))).
