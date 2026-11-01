/*  kb/schema.pl : fact schema (interface 2)

    Owner:    Knowledge engineer, with the Integration programmer
    Name:     <write your name>
    Tasks:    T3.1
    Contract: INTERFACES.md section 2.4
    Report:   3.2.1 Fact Types

    Declares every fact predicate the exporter may write to
    facts/<scan_id>.pl. Declaring them dynamic gives the closed-world
    assumption: a predicate with no facts simply fails (e.g. no
    mfa_enabled/1 fact = MFA is off) instead of raising an existence error.

    Naming rules (INTERFACES.md 2.1):
      - Resource IDs are quoted atoms:            'i-09e8287ac3e0e549f'
      - The external attacker is the atom:        internet
      - Provider:                                 aws | gcp | oci
      - Severity (lowercase):                     critical | high | medium | low | warning | info
      - Ports are integers, "all ports" =         0, 65535
      - Protocol:                                 tcp | udp | icmp | all
      - "Any resource" target:                    any

    Do not add or rename a predicate here without updating INTERFACES.md
    in the same commit (see its change rule).
*/

% name/2 is a built-in in SWI-Prolog. The contract uses it for display
% names, so it is redefined as a fact table. Inside this engine, never call
% name/2 to convert atoms to codes; use atom_codes/2 instead.
:- redefine_system_predicate(name/2).

:- dynamic
    resource/3,          % resource(Id, Type, Provider)
    name/2,              % name(Id, Name)
    has_public_ip/1,     % has_public_ip(Instance)
    protected_by/2,      % protected_by(Instance, NetRule)
    open_to_internet/4,  % open_to_internet(NetRule, Protocol, FromPort, ToPort)
    runs_as/2,           % runs_as(Instance, Identity)
    can_assume/2,        % can_assume(Principal, Role)
    allows/3,            % allows(Identity, Permission, Target)
    user/1,              % user(User)
    console_access/1,    % console_access(User)
    mfa_enabled/1,       % mfa_enabled(User)
    public_bucket/1,     % public_bucket(Bucket)
    sensitive/1,         % sensitive(Asset)
    finding/3.           % finding(Id, RuleId, Severity)

% Facts come from more than one file (one scan file + sensitive_overrides.pl).
:- multifile
    resource/3, name/2, has_public_ip/1, protected_by/2, open_to_internet/4,
    runs_as/2, can_assume/2, allows/3, user/1, console_access/1,
    mfa_enabled/1, public_bucket/1, sensitive/1, finding/3.

:- discontiguous
    resource/3, name/2, has_public_ip/1, protected_by/2, open_to_internet/4,
    runs_as/2, can_assume/2, allows/3, user/1, console_access/1,
    mfa_enabled/1, public_bucket/1, sensitive/1, finding/3.
