/*  stub.pl : marker for abstract predicates

    Owner:    Project manager
    Name:     Abdulaziz Egal Aljofi
    Purpose:  Every predicate that a member still has to write calls
              abstract/2. Calling it raises a clear error that names the
              predicate and the task, instead of failing silently.

    Track the remaining work:
        grep -rn "abstract(\|TODO(T" scanner/inference_engine

    Delete this file and its line in load.pl once nothing calls abstract/2.
*/

:- multifile prolog:error_message//1.

%!  abstract(+PredicateIndicator, +TaskId) is det.
%
%   Throws not_implemented(PredicateIndicator, TaskId).

abstract(PI, Task) :-
    throw(error(not_implemented(PI, Task), _)).

prolog:error_message(not_implemented(PI, Task)) -->
    [ '~w is not implemented yet (task ~w)'-[PI, Task] ].
