/*  search_bfs.pl -- alternative strategy for comparison (T4.5):
    breadth-first search over partial paths, no tabling, no pruning.
    Finds the same paths as attack_path/2 (same depth limit, simple
    paths only) but in order of length.                                  */

:- module(search_bfs, [bfs_paths/2]).
:- use_module(rules).
:- use_module(engine, [max_depth/1]).

bfs_paths(Asset, Paths) :-
    user:sensitive(Asset),
    max_depth(D),
    bfs([p(internet, [internet], [])], Asset, D, Found),
    maplist(reverse, Found, Paths).

bfs([], _, _, []).
bfs([p(N, Vis, Rev) | Queue], Goal, D, Found) :-
    length(Rev, L),
    (   N == Goal
    ->  Found = [Rev | More], Children = []
    ;   L < D
    ->  findall(p(M, [M | Vis], [step(N, M, R, E) | Rev]),
                ( step(N, M, R, E), \+ memberchk(M, Vis) ), Children),
        Found = More
    ;   Children = [], Found = More
    ),
    append(Queue, Children, Queue1),       % FIFO queue
    bfs(Queue1, Goal, D, More).
