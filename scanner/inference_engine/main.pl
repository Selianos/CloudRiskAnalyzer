/*  main.pl : command-line entry point

    Owner:    Inference programmer
    Name:     <write your name>
    Tasks:    T4.1
    Used by:  integration/attack_path_job.py, when the user presses the
              "Attack Path" button

        swipl scanner/inference_engine/main.pl <facts_file> <verdict_file>

    Exit code 0 on success, non-zero on failure, so the caller can mark
    the job as failed without affecting Sahaba's scan results.
*/

:- ensure_loaded(load).

:- initialization(main, main).

%!  main is det.
%
%   Reads <facts_file> and <verdict_file> from the command line, calls
%   load_facts/1, then write_verdict/2.

main :-
    abstract(main/0, 'T4.1').
