/*  tests/run_tests.pl : runs every plunit test

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.3
    Report:   4.1 Test Cases, 4.2 Verification and Validation

        swipl -g run_tests -t halt scanner/inference_engine/tests/run_tests.pl

    Each test loads its own scenario from tests/fixtures/ with load_facts/1.
    Fixture files use the same format as facts/<scan_id>.pl
    (INTERFACES.md 2.3): header comment, facts only, one provider per file.
    Name them <case>-<provider>.pl, e.g. tc_s03-oci.pl, and cover AWS, GCP
    and OCI.
*/

:- use_module(library(plunit)).

:- ensure_loaded('../load').

:- ensure_loaded(test_standard).
:- ensure_loaded(test_edge).
:- ensure_loaded(test_boundary).
:- ensure_loaded(test_multicloud).
