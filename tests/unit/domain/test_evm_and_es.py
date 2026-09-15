from app.domain.alerts import evaluate_alerts
from app.domain.earned_schedule import compute_earned_schedule
from app.domain.entities import AlertStatus, EvidenceStatus
from app.domain.evm_engine import compute_evm_core
from app.domain.metrics import compute_metrics


PV_CURVE = [0.0, 100_000, 200_000, 300_000, 400_000, 500_000]


def test_traditional_evm_with_evidence():
    core = compute_evm_core(
        bac=500_000,
        pv=200_000,
        ac=180_000,
        physical_percent=0.4,
        evidence_status=EvidenceStatus.VALIDATED,
    )
    assert core.ev == 200_000
    assert round(core.cpi, 4) == round(200_000 / 180_000, 4)
    assert core.spi == 1.0
    assert core.cv == 20_000
    assert core.sv == 0.0
    assert core.evidence_locked is False


def test_earned_schedule_interpolation():
    result = compute_earned_schedule(PV_CURVE, ev=250_000, at=3)
    assert result.c == 2
    assert abs(result.i - 0.5) < 1e-9
    assert abs(result.es - 2.5) < 1e-9
    assert abs(result.svt - (-0.5)) < 1e-9
    assert abs(result.spit - (2.5 / 3)) < 1e-9


def test_green_alert_matrix():
    alerts = evaluate_alerts(cpi=1.05, spit=1.02, tcpi=0.97, evidence_locked=False)
    assert alerts.overall is AlertStatus.GREEN


def test_yellow_alert_matrix():
    alerts = evaluate_alerts(cpi=0.94, spit=0.96, tcpi=1.06, evidence_locked=False)
    assert alerts.overall is AlertStatus.YELLOW
    assert alerts.cpi is AlertStatus.YELLOW


def test_red_alert_on_lock():
    metrics = compute_metrics(
        project_id="p1",
        period="2026-03-01",
        bac=500_000,
        pv=200_000,
        ac=180_000,
        physical_percent=0.4,
        evidence_status=EvidenceStatus.UPLOADED,
        pv_curve=PV_CURVE,
        at=2,
    )
    assert metrics.core.ev == 0.0
    assert metrics.core.evidence_locked is True
    assert metrics.alerts.overall is AlertStatus.RED
