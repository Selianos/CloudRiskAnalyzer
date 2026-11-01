"""
attack_path_job.py
==================

Runs the Prolog engine for one scan when the user presses "Attack Path".

Owner:    Integration programmer
Name:     <write your name>
Tasks:    T2.6, T2.7
Contract: INTERFACES.md section 5

Flow:
    frontend "Attack Path" button -> web-api -> Redis queue -> worker.py
    -> run_attack_path(scan_id) -> internal-backend -> database -> dashboard

The facts file already exists: it was written by ``export_facts`` when the
scan finished. This job only runs::

    swipl scanner/inference_engine/main.pl facts/<scan_id>.pl verdicts/<scan_id>.json
"""

from __future__ import annotations

from pathlib import Path

ENGINE_DIR = Path(__file__).resolve().parent.parent
MAIN_PL = ENGINE_DIR / "main.pl"
FACTS_DIR = ENGINE_DIR / "facts"
VERDICTS_DIR = ENGINE_DIR / "verdicts"


def run_attack_path(scan_id: str) -> dict:
    """Run ``main.pl`` on ``facts/<scan_id>.pl`` and return the verdict.

    Returns the parsed ``verdicts/<scan_id>.json`` (INTERFACES.md section 5).
    Raises if the facts file is missing or ``swipl`` exits with an error, so
    the worker can mark the job as failed.
    """
    raise NotImplementedError("T2.6")
