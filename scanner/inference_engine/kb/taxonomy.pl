/*  kb/taxonomy.pl : multi-cloud resource taxonomy

    Owner:    Knowledge engineer
    Name:     <write your name>
    Tasks:    T3.3
    Contract: INTERFACES.md sections 2.5 and 3
    Report:   3.2.3 Multi-Cloud Resource Taxonomy
*/

%!  isa(?ProviderType, ?GenericClass) is nondet.
%
%   Maps each provider-specific type atom written by the exporter to its
%   generic class, so one attack rule covers AWS, GCP and OCI.
%
%   Generic classes: instance | network_rule | identity | storage
%
%   Provider types (INTERFACES.md 2.5):
%     instance      ec2_instance, gce_instance, oci_instance
%     network_rule  security_group, gcp_firewall_rule, oci_security_list
%     identity      iam_user, iam_role, gcp_service_account, oci_user
%     storage       s3_bucket, gcs_bucket, oci_bucket
%
%   Example:  isa(ec2_instance, instance).
%
%   Every generic class must have a type for each of AWS, GCP and OCI.
%   PROPOSED (pending INTERFACES.md 2.5): oci_dynamic_group as an OCI
%   identity, so an OCI instance can act through its dynamic group (gap 4).

:- dynamic isa/2.

% TODO(T3.3): one isa/2 fact per provider type listed above.
