/*  run.pl -- command-line entry point used by worker.py
    swipl engine/run.pl -- <facts.pl> <verdict.json> <scan_id> <provider>  */
:- initialization(main, main).
:- use_module(engine).
:- use_module(verdict).

main :-
    current_prolog_flag(argv, [Facts, Out, ScanId, Provider | _]),
    load_facts(Facts),
    write_verdict(ScanId, Provider, Out),
    format("verdict written to ~w~n", [Out]).
