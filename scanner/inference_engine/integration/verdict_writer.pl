/*  integration/verdict_writer.pl : verdict file (interface 5)

    Owner:    Integration programmer
    Name:     <write your name>
    Tasks:    T2.6
    Contract: INTERFACES.md section 5
    Report:   3.5.3 Verdict Output and Dashboard
    Uses:     attack_path/2, rule_info/3, finding/3, prolog_severity/3,
              verdict/5, fix_order/1

    Output format (INTERFACES.md section 5):

    {
      "scan_id": "scan-0001",
      "generated_at": "2026-11-05T14:30:00+03:00",
      "attack_paths": [
        { "target": "customer-data", "length": 4,
          "steps": [ { "from": "internet", "to": "i-0abc",
                       "rule": "r1_exposed_service",
                       "description": "Instance has a public IP and an open inbound rule" } ] }
      ],
      "verdicts": [
        { "resource_id": "sg-0web", "rule_id": "AWS-EC2-001",
          "sahaba_severity": "critical", "prolog_severity": "critical",
          "reason": "on_path_to", "target": "customer-data", "path_count": 1 }
      ],
      "fix_order": [
        { "resource_id": "sg-0web", "rule_id": "AWS-EC2-001", "paths_closed": 1 }
      ]
    }

    - reason is on_path_to or no_path_to_sensitive_asset (target = null)
    - severities are lowercase, as in INTERFACES.md 2.1
*/

%!  write_verdict(+ScanId, +VerdictFile) is det.
%
%   Writes the verdict JSON for the facts currently loaded to VerdictFile
%   (verdicts/<scan_id>.json).

write_verdict(_ScanId, _VerdictFile) :-
    abstract(write_verdict/2, 'T2.6').
