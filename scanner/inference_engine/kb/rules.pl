/*  kb/rules.pl : attack rules (interface 3)

    Owner:    Knowledge engineer
    Name:     <write your name>
    Tasks:    T3.2
    Contract: INTERFACES.md section 3
    Report:   3.2.2 Attack Rules
    Used by:  Inference programmer (engine/) - only through step/3,
              sensitive/1 and rule_info/3

    Every attack rule is one clause of step/3 plus one rule_info/3 fact.
    Rules may use the fact predicates (kb/schema.pl), isa/2 and grants/3.
    For each rule, write the English sentence and the first-order logic
    above the clause (report 3.2.2).

    AWS, GCP and OCI are all required. Match resource types through isa/2
    (e.g. isa(Type, instance)), never through a provider-specific type atom,
    so one rule covers all three providers. Each template below lists the
    providers it must fire for; a missing provider is listed with the
    reason, so it can be reported in 5.2 Limitations.
*/

%!  step(?From, ?To, ?RuleName) is nondet.
%
%   An attacker who controls From can gain control of To, because of
%   RuleName. From is internet or a resource ID; To is a resource ID.

%!  rule_info(?RuleName, ?Stage, ?Description) is nondet.
%
%   Stage is exactly one of: initial_access | identity_movement | impact
%   Description is a string, used by explain/1 and the verdict file.

:- dynamic step/3, rule_info/3.
:- discontiguous step/3, rule_info/3.

% Stage: initial_access ------------------------------------------------------

% TODO(T3.2) R1 r1_exposed_service
%   "Instance has a public IP and an open inbound rule"
%   Providers: AWS (security group), GCP (firewall rule),
%              OCI (security list of the instance's subnet)
%   step(internet, Instance, r1_exposed_service) :- ...

% TODO(T3.2) R2 (weak credentials: console access without MFA)
%   Providers: AWS (iam_user), OCI (oci_user).
%              GCP: no user accounts are scanned.
%   step(internet, User, r2_...) :- ...

% Stage: identity_movement ---------------------------------------------------

% TODO(T3.2) R3
%   Providers: AWS, GCP, OCI unless the rule's data is missing for one
%   step(..., ..., r3_...) :- ...

% TODO(T3.2) R4 r4_instance_role
%   "Whoever controls the instance can act as its role"
%   Providers: AWS (instance profile role), GCP (service account),
%              OCI (dynamic group, needs the scanner change for gap 4)
%   step(Instance, Identity, r4_instance_role) :- ...

% TODO(T3.2) R5 r5_role_assumption
%   Providers: AWS (trust policy), GCP (serviceAccountUser / TokenCreator).
%              OCI: no role assumption between identities.
%   step(Principal, Role, r5_role_assumption) :- ...

% Stage: impact --------------------------------------------------------------

% TODO(T3.2) R6 r6_data_access
%   "The identity is allowed to read the asset"
%   Providers: AWS, GCP, OCI (grants/3 from IAM policy statements)
%   step(Identity, Asset, r6_data_access) :- ...
