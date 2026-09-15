"""Orquestación pura: EVM + Earned Schedule + semáforos."""

from __future__ import annotations

from dataclasses import dataclass

from .alerts import AlertMatrix, evaluate_alerts
from .earned_schedule import EarnedSchedule, compute_earned_schedule
from .entities import EvidenceStatus
from .evm_engine import EvmCore, compute_evm_core


@dataclass(frozen=True)
class EvmMetrics:
    project_id: str
    period: str
    at: float
    core: EvmCore
    schedule: EarnedSchedule
    alerts: AlertMatrix


def compute_metrics(
    *,
    project_id: str,
    period: str,
    bac: float,
    pv: float,
    ac: float,
    physical_percent: float,
    evidence_status: EvidenceStatus,
    pv_curve: list[float],
    at: float,
) -> EvmMetrics:
    core = compute_evm_core(
        bac=bac,
        pv=pv,
        ac=ac,
        physical_percent=physical_percent,
        evidence_status=evidence_status,
    )
    schedule = compute_earned_schedule(pv_curve, core.ev, at)
    alerts = evaluate_alerts(
        cpi=core.cpi,
        spit=schedule.spit,
        tcpi=core.tcpi,
        evidence_locked=core.evidence_locked,
    )
    return EvmMetrics(
        project_id=project_id,
        period=period,
        at=at,
        core=core,
        schedule=schedule,
        alerts=alerts,
    )
