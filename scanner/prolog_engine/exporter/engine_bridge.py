"""engine_bridge.py -- called by worker.py after every scan (T2.2, T2.6)."""
import logging
import os
import subprocess
from pathlib import Path

try:
    from .exporter import export_scan
except ImportError:
    from exporter import export_scan

# scanner/prolog_engine/ inside the scanner container
ENGINE_DIR = Path(os.getenv("PROLOG_ENGINE_DIR", Path(__file__).resolve().parent.parent))


def run_attack_path_engine(scan_id: str, provider: str, results: dict) -> Path:
    facts = export_scan(scan_id, provider, results, out_dir=str(ENGINE_DIR / "facts"))
    verdict = ENGINE_DIR / "verdicts" / f"{scan_id}.json"
    verdict.parent.mkdir(exist_ok=True)
    subprocess.run(["swipl", str(ENGINE_DIR / "engine" / "run.pl"), "--",
                    str(facts), str(verdict), scan_id, provider.lower()],
                   check=True, timeout=300, capture_output=True, text=True)
    logging.info(f"Prolog verdict for {scan_id} written to {verdict}")
    return verdict
