/*  kb/permissions.pl : permission rules (allows -> grants)

    Owner:    Knowledge engineer
    Name:     <write your name>
    Tasks:    T3.2
    Contract: INTERFACES.md section 3
    Report:   3.2.2 Attack Rules (permission rules)

    The exporter copies raw permissions as allows/3 and never decides what
    they mean. This file turns them into read / write / admin, as in Saha [5].
*/

%!  permission_class(?Permission, ?Class) is nondet.
%
%   Permission is the exact permission atom from allows/3:
%     AWS  an IAM action                     's3:GetObject', 's3:*', '*'
%     GCP  an IAM role                       'roles/storage.objectViewer'
%     OCI  "<verb> <resource-type>" from a policy statement
%          (Allow group G to <verb> <resource-type> in <location>)
%                                            'read buckets', 'manage object-family'
%   Class is read | write | admin.
%   Wildcards such as 's3:Get*' are matched by prefix.
%   OCI verbs: inspect and read -> read, use -> write, manage -> admin;
%   resource type all-resources covers every resource.
%
%   Examples:
%     permission_class('s3:GetObject', read).
%     permission_class('*', admin).
%     permission_class('roles/storage.objectViewer', read).
%     permission_class('manage object-family', admin).

:- dynamic permission_class/2.

% TODO(T3.2): permission_class/2 facts for AWS actions.
% TODO(T3.2): permission_class/2 facts for GCP roles.
% TODO(T3.2): permission_class/2 facts for OCI verbs and resource types.

%!  grants(?Identity, ?Class, ?Target) is nondet.
%
%   Derived from allows/3 and permission_class/2.
%   admin implies write and read.
%   Target is a resource ID or the atom any; rules that reach data must
%   treat grants(I, read, any) as reaching every storage resource.

grants(_Identity, _Class, _Target) :-
    abstract(grants/3, 'T3.2').
