/*  engine/search.pl : attack path search

    Owner:    Inference programmer
    Name:     <write your name>
    Tasks:    T4.3 (strategy decided in T1.2), T4.5 (alternative strategy)
    Contract: INTERFACES.md section 4
    Report:   3.3.2 Attack Path Search, 4.3.2 Search Strategy Comparison
    Uses:     step/3, sensitive/1, reachable/2
*/

%!  max_depth(?Depth) is det.
%
%   Maximum number of steps in a path. The team can change it.

max_depth(6).

%!  attack_path(?Target, -Path) is nondet.
%
%   One solution per path; backtracking gives every path, so findall/3
%   returns all of them, not only the shortest.
%
%   Path is a list of step(From, To, RuleName) terms, in order:
%     [ step(internet,   'i-0abc',        r1_exposed_service),
%       step('i-0abc',   'AROA-web',      r4_instance_role),
%       step('AROA-web', 'AROA-adm',      r5_role_assumption),
%       step('AROA-adm', 'customer-data', r6_data_access) ]
%
%   Guarantees:
%     - the first step starts at internet; the last step ends at Target
%     - sensitive(Target) is true
%     - no resource appears twice in a path
%     - length(Path) =< max_depth

attack_path(_Target, _Path) :-
    abstract(attack_path/2, 'T4.3').

% TODO(T4.5): alternative search strategy for the benchmark comparison,
% with the same arguments and guarantees as attack_path/2.
