/*  rules.pl -- knowledge base (attack rules), fixed between scans.
    DRAFT used by the inference engine; the knowledge engineer owns the
    final wording of R1-R6 (report section 3.2.2).                      */

:- module(rules, [step/4, grants/3, is_a/2, kind/2, storage/1, rule_text/2]).

/* Working-memory predicates written by the exporter (facts.pl).
   Declared dynamic so a missing predicate is simply false
   (closed-world assumption).                                           */
:- dynamic user:resource/3, user:label/2, user:open_to_internet/2,
           user:uses_network_rule/2, user:instance_identity/2,
           user:can_assume/2, user:allows/3, user:console_login/1,
           user:mfa_enabled/1, user:public_bucket/1, user:sensitive/1,
           user:finding/3.

/* ---- Multi-cloud taxonomy (is-a hierarchy) --------------------------- */
is_a(ec2_instance,     compute).
is_a(gce_instance,     compute).
is_a(oci_instance,     compute).
is_a(s3_bucket,        storage).
is_a(gcs_bucket,       storage).
is_a(oci_bucket,       storage).
is_a(iam_role,         identity).
is_a(gcp_service_account, identity).
is_a(iam_user,         identity).
is_a(gcp_user,         identity).
is_a(oci_user,         identity).
is_a(security_group,   network_rule).
is_a(gcp_firewall_rule, network_rule).
is_a(oci_security_list, network_rule).

kind(R, Class) :- user:resource(R, _, Type), is_a(Type, Class).
storage(R)     :- kind(R, storage).

/* ---- Permission rules: allows/3 (from policies) -> grants/3 ---------- */
:- table grants/3.

implies(admin, write).
implies(write, read).

grants(P, A, R) :- user:allows(P, A, R), R \== '*'.
grants(P, A, R) :- user:allows(P, A, '*'), storage(R).
grants(P, A, R) :- implies(B, A), grants(P, B, R).

/* ---- Attack rules: step(From, To, RuleId, Evidence) -------------------
   Goal order: the most selective relation first, the type check last,
   so the rules stay fast whichever argument is bound.                  */
remote_port(22).
remote_port(3389).
remote_port(all).

% R1 initial access: a compute resource behind a network rule that opens a
%    remote-login port to the internet can be taken over from the internet.
step(internet, I, r1, via(Rule, Port)) :-
    user:open_to_internet(Rule, Port),
    remote_port(Port),
    user:uses_network_rule(I, Rule),
    kind(I, compute).

% R2 initial access: a user with console login and no MFA can be
%    phished or brute-forced from the internet.
step(internet, U, r2, no_mfa(U)) :-
    user:console_login(U),
    \+ user:mfa_enabled(U).

% R3 identity movement: whoever controls a compute resource can act as
%    the identity (role / service account) attached to it.
step(I, Id, r3, attached(I, Id)) :-
    user:instance_identity(I, Id),
    kind(I, compute).

% R4 identity movement: an identity that may assume another identity
%    (trust policy, or admin over IAM) can act as it.
step(P, Q, r4, trust(P, Q)) :-
    user:can_assume(P, Q),
    P \== Q.
step(P, Q, r4, admin(P)) :-
    user:allows(P, admin, '*'),
    kind(Q, identity), Q \== P,
    \+ user:can_assume(P, Q).

% R5 impact: an identity with read permission on a storage resource
%    can read its data.
step(P, B, r5, grants(P, read, B)) :-
    grants(P, read, B),
    kind(P, identity).

% R6 initial access: a public bucket can be read by anyone.
step(internet, B, r6, public(B)) :-
    user:public_bucket(B).

rule_text(r1, 'exposed remote-login port on a compute resource').
rule_text(r2, 'console login without MFA').
rule_text(r3, 'act as the identity attached to the compute resource').
rule_text(r4, 'assume another identity').
rule_text(r5, 'read data with granted permission').
rule_text(r6, 'bucket is public').
