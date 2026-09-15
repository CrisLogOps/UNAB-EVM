"""Matriz de semáforos CPI / SPI(t) / TCPI + candado de evidencia."""

from __future__ import annotations

from dataclasses import dataclass

from .entities import AlertStatus

CPI_GREEN_MIN = 1.0
CPI_YELLOW_MIN = 0.90
SPIT_GREEN_MIN = 1.0
SPIT_YELLOW_MIN = 0.90
TCPI_GREEN_MAX = 1.0
TCPI_YELLOW_MAX = 1.10


def status_cpi(cpi: float) -> AlertStatus:
    if cpi >= CPI_GREEN_MIN:
        return AlertStatus.GREEN
    if cpi >= CPI_YELLOW_MIN:
        return AlertStatus.YELLOW
    return AlertStatus.RED


def status_spit(spit: float) -> AlertStatus:
    if spit >= SPIT_GREEN_MIN:
        return AlertStatus.GREEN
    if spit >= SPIT_YELLOW_MIN:
        return AlertStatus.YELLOW
    return AlertStatus.RED


def status_tcpi(tcpi: float) -> AlertStatus:
    if tcpi <= TCPI_GREEN_MAX:
        return AlertStatus.GREEN
    if tcpi <= TCPI_YELLOW_MAX:
        return AlertStatus.YELLOW
    return AlertStatus.RED


def combine(*statuses: AlertStatus) -> AlertStatus:
    if any(s is AlertStatus.RED for s in statuses):
        return AlertStatus.RED
    if any(s is AlertStatus.YELLOW for s in statuses):
        return AlertStatus.YELLOW
    return AlertStatus.GREEN


@dataclass(frozen=True)
class AlertMatrix:
    cpi: AlertStatus
    spit: AlertStatus
    tcpi: AlertStatus
    overall: AlertStatus


def evaluate_alerts(
    *,
    cpi: float,
    spit: float,
    tcpi: float,
    evidence_locked: bool,
) -> AlertMatrix:
    cpi_s = status_cpi(cpi)
    spit_s = status_spit(spit)
    tcpi_s = status_tcpi(tcpi)
    overall = AlertStatus.RED if evidence_locked else combine(cpi_s, spit_s, tcpi_s)
    return AlertMatrix(cpi=cpi_s, spit=spit_s, tcpi=tcpi_s, overall=overall)
