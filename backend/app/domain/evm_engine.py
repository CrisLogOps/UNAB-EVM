"""Métricas EVM tradicionales. Independiente de FastAPI y de la base de datos."""

from __future__ import annotations

from dataclasses import dataclass

from .entities import EvidenceStatus
from .evidence_lock import earned_value


def _safe_div(numerator: float, denominator: float) -> float:
    if denominator == 0:
        return 0.0
    return numerator / denominator


@dataclass(frozen=True)
class EvmCore:
    bac: float
    pv: float
    ev: float
    ac: float
    cpi: float
    spi: float
    cv: float
    sv: float
    eac: float
    vac: float
    tcpi: float
    evidence_locked: bool


def compute_evm_core(
    *,
    bac: float,
    pv: float,
    ac: float,
    physical_percent: float,
    evidence_status: EvidenceStatus,
) -> EvmCore:
    ev = earned_value(physical_percent, bac, evidence_status)
    cpi = _safe_div(ev, ac)
    spi = _safe_div(ev, pv)
    cv = ev - ac
    sv = ev - pv
    eac = _safe_div(bac, cpi) if cpi > 0 else 0.0
    vac = bac - eac if cpi > 0 else 0.0
    remaining_work = bac - ev
    remaining_funds = bac - ac
    tcpi = _safe_div(remaining_work, remaining_funds)
    return EvmCore(
        bac=bac,
        pv=pv,
        ev=ev,
        ac=ac,
        cpi=cpi,
        spi=spi,
        cv=cv,
        sv=sv,
        eac=eac,
        vac=vac,
        tcpi=tcpi,
        evidence_locked=ev == 0.0 and physical_percent > 0.0,
    )
