/*  tests/test_edge.pl : edge cases

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.1, T5.2, T5.3
    Report:   4.1.2 Edge Cases

    Same table format as 4.1.1. Remove blocked(...) when a test is written.
*/

:- begin_tests(edge_cases).

% TODO(T5.2) TC-E01 role cycle (A can_assume B, B can_assume A) terminates
test(tc_e01_role_cycle, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-E02 sensitive asset with no path
test(tc_e02_no_path, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-E03 two paths to the same asset
test(tc_e03_two_paths, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-E04 one fix closes several paths
test(tc_e04_one_fix_many_paths, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-E05 user without MFA reaches only non-sensitive data
test(tc_e05_no_mfa_non_sensitive, [blocked('T5.2: not written yet')]) :-
    true.

:- end_tests(edge_cases).
