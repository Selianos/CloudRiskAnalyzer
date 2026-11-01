/*  load.pl : loads the knowledge base and the inference engine

    Owner:    Inference programmer
    Name:     <write your name>
    Tasks:    T4.1
    Report:   3.1.2 Project Structure

    Loads everything except a scan's facts. Tests and benchmarks consult
    this file, then call load_facts/1 with a fixture or generated file.

        swipl scanner/inference_engine/load.pl

    Expert-system mapping (report 3.1.2):
      kb/        knowledge base (rules, stays fixed)
      facts/     working memory (one file per scan)
      engine/    inference engine
*/

:- ensure_loaded(stub).

% Knowledge base (Knowledge engineer)
:- ensure_loaded(kb/schema).
:- ensure_loaded(kb/taxonomy).
:- ensure_loaded(kb/permissions).
:- ensure_loaded(kb/rules).
:- ensure_loaded(kb/second_opinion).

% Inference engine (Inference programmer)
:- ensure_loaded(engine/reachability).
:- ensure_loaded(engine/search).
:- ensure_loaded(engine/explain).

% Verdict output (Integration programmer)
:- ensure_loaded(integration/verdict_writer).

%!  load_facts(+FactsFile) is det.
%
%   Loads one facts/<scan_id>.pl file (or a test fixture) together with
%   facts/sensitive_overrides.pl, after removing the facts of any previous
%   scan and clearing the tables of reachable/2, so that one Prolog session
%   can analyse several scans in a row.

load_facts(_FactsFile) :-
    abstract(load_facts/1, 'T4.1').
