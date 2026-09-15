from app.domain.entities import EvidenceStatus
from app.domain.evidence_lock import earned_value, evidence_unlocks_ev


def test_lock_without_validated_evidence():
    for status in (
        EvidenceStatus.MISSING,
        EvidenceStatus.UPLOADED,
        EvidenceStatus.REJECTED,
    ):
        assert evidence_unlocks_ev(status) is False
        assert earned_value(0.4, 100_000, status) == 0.0


def test_unlock_with_validated_evidence():
    assert earned_value(0.4, 100_000, EvidenceStatus.VALIDATED) == 40_000
