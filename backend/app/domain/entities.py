"""Entidades de dominio EVM — sin dependencias de framework ni persistencia."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class UserRole(str, Enum):
    OWNER = "owner"
    PMO = "pmo"
    ADMIN_OBRA = "admin_obra"
    FINANCE = "finance"
    WAREHOUSE = "warehouse"
    FIELD = "field"
    SUBCONTRACTOR = "subcontractor"
    COMMERCIAL = "commercial"
    OFICINA_TECNICA = "oficina_tecnica"
    VIEWER = "viewer"


class EvidenceStatus(str, Enum):
    MISSING = "missing"
    UPLOADED = "uploaded"
    VALIDATED = "validated"
    REJECTED = "rejected"


class AlertStatus(str, Enum):
    GREEN = "green"
    YELLOW = "yellow"
    RED = "red"


class BaselineStatus(str, Enum):
    DRAFT = "DRAFT"
    FROZEN = "FROZEN"


@dataclass(frozen=True)
class Tenant:
    id: str
    name: str
    slug: str


@dataclass(frozen=True)
class Project:
    id: str
    tenant_id: str
    name: str
    code: str
    bac: float
    start_date: str
    finish_date: str
    baseline_status: BaselineStatus
    baseline_version: Optional[str] = None
    currency: str = "CLP"


@dataclass(frozen=True)
class Task:
    id: str
    project_id: str
    activity_code: str
    name: str
    planned_start: str
    planned_finish: str
    budget_pv: float
    weight: float = 1.0
    unit: Optional[str] = None
    qty: Optional[float] = None


@dataclass(frozen=True)
class ProgressReport:
    id: str
    project_id: str
    task_id: str
    reported_by: str
    period: str
    physical_percent: float
    actual_cost: float
    evidence_id: Optional[str]
    evidence_status: EvidenceStatus
    client_event_id: str
