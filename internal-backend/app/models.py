from pydantic import BaseModel


class ScanResult(BaseModel):
    findings: list
    resources: list


class StatusUpdate(BaseModel):
    status: str
