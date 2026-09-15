"""Candado metodológico: sin evidencia validada, EV no suma."""

from __future__ import annotations

from .entities import EvidenceStatus


def evidence_unlocks_ev(status: EvidenceStatus) -> bool:
    """Solo evidencia validada desbloquea Valor Ganado."""
    return status is EvidenceStatus.VALIDATED


def earned_value(physical_percent: float, bac: float, evidence_status: EvidenceStatus) -> float:
    """
    EV = % avance físico × BAC  si evidencia.estado = validated
    EV = 0                      en cualquier otro caso (candado).
    """
    if bac < 0:
        raise ValueError("BAC no puede ser negativo")
    if not 0.0 <= physical_percent <= 1.0:
        raise ValueError("physical_percent debe estar en [0, 1]")
    if not evidence_unlocks_ev(evidence_status):
        return 0.0
    return physical_percent * bac
