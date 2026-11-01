/*  benchmarks/run_benchmarks.pl : runtime of each search strategy

    Owner:    Domain expert (runner, T5.5), Inference programmer (strategies, T4.5)
    Name:     <write your name>
    Report:   4.3.1 Benchmark Setup, 4.3.2 Search Strategy Comparison

        swipl scanner/inference_engine/benchmarks/run_benchmarks.pl

    Results (CSV) go to benchmarks/results/, which is tracked so the report
    tables and charts can be reproduced.
*/

:- ensure_loaded('../load').
:- ensure_loaded(generate_env).

%!  run_benchmark(+Size, +Provider, +Strategy, -Runtime, -PathCount) is det.
%
%   Loads the generated environment of Size resources for Provider
%   (aws | gcp | oci), runs Strategy, and returns the average runtime over
%   several runs and the number of paths found.

run_benchmark(_Size, _Provider, _Strategy, _Runtime, _PathCount) :-
    abstract(run_benchmark/5, 'T5.5').
