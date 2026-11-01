/*  tests/test_multicloud.pl : provider coverage

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.2, T5.3, T5.4
    Report:   4.1.1 Standard Cases, 4.2 Verification and Validation

    AWS, GCP and OCI are all required. These tests check that each rule
    fires for every provider it lists in kb/rules.pl, and does not fire
    where a provider is documented as not covered.
    Remove blocked(...) when a test is written.
*/

:- begin_tests(multicloud).

% TODO(T5.2) TC-M01 every provider type atom has an isa/2 class
test(tc_m01_taxonomy_complete, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-M02 r1_exposed_service fires on AWS, GCP and OCI fixtures
test(tc_m02_r1_all_providers, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-M03 r4_instance_role fires on AWS, GCP and OCI fixtures
test(tc_m03_r4_all_providers, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-M04 r6_data_access fires on AWS, GCP and OCI fixtures
test(tc_m04_r6_all_providers, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-M05 OCI permissions: inspect/read -> read, use -> write, manage -> admin
test(tc_m05_oci_permission_classes, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-M06 OCI finding ('OCI-NET-001', severity low) is re-evaluated on a path
test(tc_m06_oci_finding_reevaluated, [blocked('T5.2: not written yet')]) :-
    true.

:- end_tests(multicloud).
