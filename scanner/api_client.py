import os
import logging
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

class InternalBackendClient:
    def __init__(self):
        self.base_url = os.getenv("INTERNAL_BACKEND_URL", "http://internal-backend:8000").rstrip("/")
        self.api_key = os.getenv("WORKER_API_KEY")
        if not self.api_key:
            raise ValueError("WORKER_API_KEY environment variable is not set")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def get_job(self, job_id: str) -> dict | None:
        """Fetch job details (provider type and credentials) for a specific job ID."""
        url = f"{self.base_url}/internal/jobs/{job_id}"
        try:
            logging.info(f"Fetching job details for Job ID: {job_id}")
            res = requests.get(url, headers=self.headers, timeout=10)
            if res.status_code == 404:
                logging.error(f"Job {job_id} not found on internal backend")
                return None
            res.raise_for_status()
            return res.json()
        except Exception as e:
            logging.error(f"Failed to fetch job {job_id}: {e}")
            raise

    def update_status(self, job_id: str, status: str) -> bool:
        """Update the scan status (e.g. RUNNING, FAILED) of a job."""
        url = f"{self.base_url}/internal/jobs/{job_id}/status"
        payload = {"status": status}
        try:
            logging.info(f"Updating job {job_id} status to: {status}")
            res = requests.post(url, headers=self.headers, json=payload, timeout=10)
            res.raise_for_status()
            return True
        except Exception as e:
            logging.error(f"Failed to update status for job {job_id}: {e}")
            return False

    def submit_results(self, job_id: str, results_payload: dict) -> bool:
        """Submit scan resources and rule violation findings to the backend."""
        url = f"{self.base_url}/internal/jobs/{job_id}/results"
        try:
            logging.info(f"Submitting scan findings for Job ID: {job_id}")
            res = requests.post(url, headers=self.headers, json=results_payload, timeout=30)
            if res.status_code == 400:
                logging.error(f"Validation error returned by backend: {res.text}")
            res.raise_for_status()
            logging.info(f"Successfully submitted results for Job ID: {job_id}")
            return True
        except Exception as e:
            logging.error(f"Failed to submit scan results for job {job_id}: {e}")
            raise
