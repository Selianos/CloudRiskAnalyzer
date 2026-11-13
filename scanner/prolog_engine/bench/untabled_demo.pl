% reachable/2 written without tabling, to show why tabling is needed.
:- use_module('../engine/engine').
reach_left(X, Y)  :- rules:step(X, Y, _, _).
reach_left(X, Y)  :- reach_left(X, Z), rules:step(Z, Y, _, _).
reach_right(X, Y) :- rules:step(X, Y, _, _).
reach_right(X, Y) :- rules:step(X, Z, _, _), reach_right(Z, Y).

try(Name, Goal) :-
    catch(call_with_time_limit(5, (forall(Goal, true), R = terminated)),
          time_limit_exceeded, R = 'no answer after 5 s (loop)'),
    format("  ~w: ~w~n", [Name, R]).

demo(File) :-
    load_facts(File), format("~w~n", [File]),
    try('left-recursive, no tabling ', reach_left(internet, _)),
    try('right-recursive, no tabling', reach_right(internet, _)),
    try('tabled reachable/2         ', engine:reachable(internet, _)).
demo :- demo('../tests/fixtures/gcp-demo.pl'), demo('../tests/fixtures/aws-demo.pl').
