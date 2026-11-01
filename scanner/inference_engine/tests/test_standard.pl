/*  tests/test_standard.pl : standard cases

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.1, T5.2, T5.3
    Report:   4.1.1 Standard Cases

    At least three typical environments with known attack paths, at least
    one per provider (AWS, GCP, OCI). For each test, record in the report
    table: ID, description, input facts (fixture file), query, expected
    output, actual output, pass/fail.

    Remove blocked(...) when a test is written.
*/

:- begin_tests(standard_cases).

% TODO(T5.2) TC-S01 AWS: internet -> EC2 -> role -> assumed role -> sensitive S3 bucket
test(tc_s01_aws_path, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-S02 GCP: internet -> GCE instance -> service account -> sensitive GCS bucket
test(tc_s02_gcp_path, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-S03 OCI: internet -> instance (open security list) -> dynamic group -> sensitive bucket
test(tc_s03_oci_path, [blocked('T5.2: not written yet')]) :-
    true.

% TODO(T5.2) TC-S04 OCI: internet -> user with console access and no MFA -> sensitive bucket
test(tc_s04_oci_user_no_mfa, [blocked('T5.2: not written yet')]) :-
    true.

:- end_tests(standard_cases).
