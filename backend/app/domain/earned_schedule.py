"""Earned Schedule: ES = C + I, SV(t) y SPI(t)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EarnedSchedule:
    es: float
    svt: float
    spit: float
    c: int
    i: float


def compute_earned_schedule(pv_curve: list[float], ev: float, at: float) -> EarnedSchedule:
    """
    pv_curve[k] = PV acumulado al cierre del periodo k (k = 0..n-1).
    C = último periodo entero tal que PV(C) <= EV.
    I = (EV - PV_C) / (PV_{C+1} - PV_C)  (0 si no hay periodo siguiente o delta 0).
    """
    if not pv_curve:
        raise ValueError("pv_curve no puede estar vacía")
    if at <= 0:
        raise ValueError("AT (tiempo actual) debe ser > 0")

    if ev <= pv_curve[0]:
        c = 0
        interpolation = (ev / pv_curve[0]) if pv_curve[0] else 0.0
        es = interpolation if pv_curve[0] else 0.0
        svt = es - at
        spit = es / at if at else 0.0
        return EarnedSchedule(es=es, svt=svt, spit=spit, c=c, i=interpolation)

    c = 0
    for idx, pv in enumerate(pv_curve):
        if pv <= ev:
            c = idx
        else:
            break

    if ev >= pv_curve[-1]:
        interpolation = 0.0
        c = len(pv_curve) - 1
    elif c + 1 < len(pv_curve):
        delta = pv_curve[c + 1] - pv_curve[c]
        interpolation = ((ev - pv_curve[c]) / delta) if delta else 0.0
    else:
        interpolation = 0.0

    es = c + interpolation
    svt = es - at
    spit = es / at if at else 0.0
    return EarnedSchedule(es=es, svt=svt, spit=spit, c=c, i=interpolation)
