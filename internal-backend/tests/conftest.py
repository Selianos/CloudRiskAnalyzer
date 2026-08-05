import os
import sys

# 1. Inject mock environment variables BEFORE importing config
os.environ["WORKER_API_KEY"] = "test_worker_key_12345"
os.environ["DATABASE_URL"] = "postgresql://dummy:dummy@localhost/dummy_db"
os.environ["ENCRYPTION_KEY"] = "k5u52fV1g-uY17XvFmQW4l_4_w8qXh1L1hF_89f0Xk8="

# 2. Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
