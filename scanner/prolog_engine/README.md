# Fact exporter and Sahaba integration (Abdulrahman, T2.1 - T2.7)

Turns a Sahaba scan result into Prolog facts, runs the engine after every scan
and writes a verdict JSON per scan. Report sections 3.5, Appendix B.

    python exporter/exporter.py samples/scan_aws_demo.json aws aws-demo
    swipl engine/run.pl -- facts/aws-demo.pl verdicts/aws-demo.json aws-demo aws

Scanner changes in this branch: worker.py (runs the engine after submit_results),
runner.py (sanitizer keeps password_enabled / can_use_console_password booleans),
providers/aws.py (instance profile -> role, S3 tags), Dockerfile (installs swi-prolog-nox).

Depends on feature/inference-engine (engine/engine.pl, engine/rules.pl): merge that first.
facts/ and verdicts/ hold data from real accounts and are git-ignored.
