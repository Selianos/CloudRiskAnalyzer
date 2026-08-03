import os
from dotenv import load_dotenv

load_dotenv()


def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"{name} environment variable is not set")
    return value


WORKER_API_KEY = _require("WORKER_API_KEY")
DATABASE_URL   = _require("DATABASE_URL")
ENCRYPTION_KEY = _require("ENCRYPTION_KEY")
