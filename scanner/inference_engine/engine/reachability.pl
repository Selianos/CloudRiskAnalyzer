/*  engine/reachability.pl : tabled reachability

    Owner:    Inference programmer
    Name:     <write your name>
    Tasks:    T4.2
    Contract: INTERFACES.md section 4
    Report:   3.3.1 Reachability with Tabling
    Uses:     step/3 only (never the fact predicates directly)
*/

:- table reachable/2.

%!  reachable(?From, ?To) is nondet.
%
%   True if To can be reached from From through one or more step/3
%   clauses. Tabled, so role cycles (A can_assume B, B can_assume A)
%   terminate.

reachable(_From, _To) :-
    abstract(reachable/2, 'T4.2').
