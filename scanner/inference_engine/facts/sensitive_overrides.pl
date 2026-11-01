/*  facts/sensitive_overrides.pl : assets marked sensitive by hand

    Owner:    Knowledge engineer, with the Domain expert
    Name:     <write your name>
    Contract: INTERFACES.md section 2.4 (sensitive assets)

    Use this when Sahaba cannot tag a bucket automatically (e.g. AWS bucket
    tags, gap 2). The exporter copies these facts into every scan file.
    Facts only, one per line, IDs as quoted atoms:

        sensitive('customer-data').
*/
