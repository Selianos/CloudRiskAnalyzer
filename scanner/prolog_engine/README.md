# Prolog inference engine (Abdullah, T4.1 - T4.5)

Tabled reachability, depth-limited DFS attack path search, explanation facility,
and a BFS alternative for comparison. Report sections 3.1, 3.3, 4.3.2.

    cd tests && swipl -g run_tests -t halt test_engine.pl
    swipl -g "use_module(engine/engine), load_facts('tests/fixtures/aws-demo.pl'), explain_all" -t halt

Benchmark:

    cd bench && python gen_env.py 10 && python gen_env.py 100 && python gen_env.py 1000
    swipl -g main -t halt bench.pl

Notes
- engine/rules.pl is a PLACEHOLDER draft of R1-R6 so the engine and tests run.
  The final rules belong to the knowledge engineer (Rakan, T3.1 - T3.3).
- tests/fixtures/*.pl were produced by the fact exporter (feature/fact-exporter)
  from the sample scans; they contain no real account data.
