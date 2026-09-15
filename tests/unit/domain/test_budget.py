import pytest

from app.domain.budget import apply_budget_action
from app.domain.entities import UserRole


def test_finance_proposes_then_pm_counters_then_owner_approves():
    status = apply_budget_action("awaiting_budget", "propose", UserRole.FINANCE)
    status = apply_budget_action(status, "counter", UserRole.PMO)
    status = apply_budget_action(status, "accept", UserRole.PMO)
    status = apply_budget_action(status, "approve", UserRole.OWNER)
    assert status == "active"


def test_commercial_can_give_final_approval():
    status = apply_budget_action("awaiting_budget", "propose", UserRole.FINANCE)
    status = apply_budget_action(status, "accept", UserRole.PMO)
    assert apply_budget_action(status, "approve", UserRole.COMMERCIAL) == "active"


def test_pm_cannot_approve():
    with pytest.raises(ValueError):
        apply_budget_action("pending_approval", "approve", UserRole.PMO)
