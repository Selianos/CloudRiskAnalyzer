from pydantic import BaseModel
from typing import Any

class ResourceItem(BaseModel):
    id: str
    resource_type: str
    provider_resource_id: str
    name: str
    region: str | None = None
    configuration: dict[str, Any] = {}

class FindingItem(BaseModel):
    resource_id: str
    rule_id: str
    status: str
    details: dict[str, Any] | None = None

class ScanResult(BaseModel):
    findings: list[FindingItem]
    resources: list[ResourceItem]


class StatusUpdate(BaseModel):
    status: str

class RuleSync(BaseModel):
    id: str
    provider: str
    name: str
    finding_type: str | None = None
    severity: str
    description: str
    recommendation: str
