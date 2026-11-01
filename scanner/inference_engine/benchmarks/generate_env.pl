/*  benchmarks/generate_env.pl : synthetic environment generator

    Owner:    Domain expert
    Name:     <write your name>
    Tasks:    T5.5
    Report:   4.3.1 Benchmark Setup

    Writes synthetic scans in the same format as facts/<scan_id>.pl
    (INTERFACES.md 2.3 - 2.6) to benchmarks/generated/ (ignored by git).
*/

%!  generate_env(+Size, +Provider, +File) is det.
%
%   Writes an environment of Size resources (10, 100, 1000) for Provider
%   (aws | gcp | oci) to File, using that provider's type atoms
%   (INTERFACES.md 2.5). Every size is generated for all three providers.

generate_env(_Size, _Provider, _File) :-
    abstract(generate_env/3, 'T5.5').
