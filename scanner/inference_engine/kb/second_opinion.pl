/*  kb/second_opinion.pl : severity re-evaluation, conflict resolution, best fix

    Owner:    Knowledge engineer
    Name:     <write your name>
    Tasks:    T3.4 (T3.6 optional certainty factors)
    Contract: INTERFACES.md sections 4 and 5
    Report:   3.4.1 Severity Re-evaluation, 3.4.2 Conflict Resolution,
              3.4.3 Best Fix Selection
    Uses:     attack_path/2 (engine/search.pl), finding/3
    Used by:  integration/verdict_writer.pl (T2.6)

    The argument names below mirror the fields of the verdict JSON
    (INTERFACES.md section 5), so the writer can map them one to one.
    Severities use the lowercase values of INTERFACES.md 2.1.
*/

%!  finding_on_path(?ResourceId, ?RuleId, ?Path) is nondet.
%
%   The Sahaba finding finding(ResourceId, RuleId, _) takes part in Path,
%   a list of step/3 terms produced by attack_path/2. Decide (and document)
%   when a finding counts, for every provider: e.g. a network-rule finding
%   ('AWS-EC2-001' on a security group, a GCP firewall finding, or
%   'OCI-NET-001' on a security list) counts for the r1_exposed_service
%   step of each instance that rule protects.

finding_on_path(_ResourceId, _RuleId, _Path) :-
    abstract(finding_on_path/3, 'T3.4').

%!  candidate_severity(?ResourceId, ?RuleId, ?Severity, ?OpinionRule) is nondet.
%
%   Every second-opinion rule that matches a finding proposes a severity.
%   OpinionRule is an atom naming the rule. Several may match one finding;
%   prolog_severity/3 picks the winner.

candidate_severity(_ResourceId, _RuleId, _Severity, _OpinionRule) :-
    abstract(candidate_severity/4, 'T3.4').

%!  opinion_priority(?OpinionRule, ?Priority) is nondet.
%
%   Conflict-resolution meta-rule data: higher Priority wins when several
%   candidate_severity/4 solutions exist for the same finding.

:- dynamic opinion_priority/2.

% TODO(T3.4): one opinion_priority/2 fact per OpinionRule.

%!  prolog_severity(?ResourceId, ?RuleId, ?Severity) is semidet.
%
%   The re-evaluated severity of a finding after conflict resolution.
%   Exactly one solution per finding.

prolog_severity(_ResourceId, _RuleId, _Severity) :-
    abstract(prolog_severity/3, 'T3.4').

%!  verdict(?ResourceId, ?RuleId, ?Reason, ?Target, ?PathCount) is nondet.
%
%   One solution per (finding, target) pair, matching one entry of
%   "verdicts" in the JSON file.
%     Reason    on_path_to | no_path_to_sensitive_asset
%     Target    the sensitive asset ID, or null when Reason is
%               no_path_to_sensitive_asset
%     PathCount number of paths to Target the finding takes part in

verdict(_ResourceId, _RuleId, _Reason, _Target, _PathCount) :-
    abstract(verdict/5, 'T3.4').

%!  fix_order(-Fixes) is det.
%
%   Greedy best-fix order: Fixes is a list of
%   fix(ResourceId, RuleId, PathsClosed), where fixing the findings from
%   first to last closes every attack path.

fix_order(_Fixes) :-
    abstract(fix_order/1, 'T3.4').
