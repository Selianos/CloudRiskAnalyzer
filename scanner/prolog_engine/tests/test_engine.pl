:- use_module(library(plunit)).
:- use_module('../engine/engine').
:- use_module('../engine/search_bfs').

:- begin_tests(engine).

test(aws_paths_to_customer_data, [setup(load_facts('fixtures/aws-demo.pl'))]) :-
    all_paths('customer-data', Ps), length(Ps, 4).

test(shortest_path_has_four_steps, [setup(load_facts('fixtures/aws-demo.pl'))]) :-
    all_paths('customer-data', Ps),
    aggregate_all(min(L), (member(P, Ps), length(P, L)), 4).

test(role_cycle_terminates, [setup(load_facts('fixtures/aws-demo.pl'))]) :-
    % BatchRole <-> DeployRole trust each other; tabling must still terminate
    reachable('AROAVNQVX32OBATCH001', 'AROAVNQVX32OBATCH001').

test(no_mfa_user_reaches_only_non_sensitive, [setup(load_facts('fixtures/aws-demo.pl'))]) :-
    reachable(internet, 'AIDAVNQVX32OINTERN01'),
    \+ ( attack_path(_, P), path_nodes(P, N), memberchk('AIDAVNQVX32OINTERN01', N) ).

test(public_bucket_not_sensitive, [setup(load_facts('fixtures/aws-demo.pl')), fail]) :-
    attack_path('public-assets', _).

test(gcp_service_account_path, [setup(load_facts('fixtures/gcp-demo.pl'))]) :-
    all_paths('patient-records', [P]), length(P, 3).

test(bfs_finds_same_paths, [setup(load_facts('fixtures/aws-demo.pl'))]) :-
    all_paths('customer-data', A), bfs_paths('customer-data', B),
    msort(A, SA), msort(B, SB), SA == SB.

:- end_tests(engine).
