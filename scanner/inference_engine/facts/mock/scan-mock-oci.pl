% facts/mock/scan-mock-oci.pl  (scan mock-oci, <date>, oci)
%
% Owner:    Knowledge engineer
% Name:     <write your name>
% Tasks:    T3.5
% Contract: INTERFACES.md sections 2.3, 2.4 and 2.6
% Report:   Appendix A: Draft Mock Data Set
%
% Running example for OCI: instance -> security list -> dynamic group -> bucket, and a user without MFA.
% Same format as a file the exporter writes: header comment, then facts
% only, no rules. All three mocks (aws, gcp, oci) are required, so every
% rule can be shown working on each provider.

% TODO(T3.5): resource/3 and name/2 for every resource.

% TODO(T3.5): network exposure (has_public_ip/1, protected_by/2, open_to_internet/4).

% TODO(T3.5): identities (runs_as/2, can_assume/2, allows/3, user/1,
%             console_access/1, mfa_enabled/1).

% TODO(T3.5): data (public_bucket/1, sensitive/1).

% TODO(T3.5): Sahaba findings (finding/3).
