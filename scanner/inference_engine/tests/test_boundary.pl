/*  tests/test_boundary.pl : boundary cases

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.1, T5.2, T5.3
    Report:   4.1.3 Boundary Cases

    Same table format as 4.1.1. Remove blocked(...) when a test is written.
*/

:- begin_tests(boundary_cases).

% TODO(T5.2) TC-B01 path exactly at max_depth is found
test(tc_b01_at_depth_limit, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-B02 path one step over max_depth is not found
test(tc_b02_over_depth_limit, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-B03 empty environment
test(tc_b03_empty_environment, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-B04 sensitive asset with no connections
test(tc_b04_isolated_asset, [blocked('T5.2: not written yet')]) :-
    true.

:- end_tests(boundary_cases).
