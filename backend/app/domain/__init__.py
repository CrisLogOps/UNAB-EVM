"""Motor de cálculo EVM + ES y gobernanza (candado de evidencia)."""

from .alerts import AlertMatrix, evaluate_alerts
from .earned_schedule import EarnedSchedule, compute_earned_schedule
from .entities import AlertStatus, EvidenceStatus, UserRole
from .evidence_lock import earned_value, evidence_unlocks_ev
from .evm_engine import EvmCore, compute_evm_core
from .metrics import EvmMetrics, compute_metrics
from .rbac import NAV_ITEMS, has_permission

__all__ = [
    "AlertMatrix",
    "AlertStatus",
    "EarnedSchedule",
    "EvmCore",
    "EvmMetrics",
    "EvidenceStatus",
    "NAV_ITEMS",
    "UserRole",
    "compute_earned_schedule",
    "compute_evm_core",
    "compute_metrics",
    "earned_value",
    "evaluate_alerts",
    "evidence_unlocks_ev",
    "has_permission",
]
