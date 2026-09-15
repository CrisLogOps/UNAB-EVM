"""Ciclo de presupuesto de obra: Finanzas propone, PM contrapone, Comercial/Owner aprueba."""

from __future__ import annotations

from .entities import UserRole

AWAITING = "awaiting_budget"
PROPOSED = "budget_proposed"
COUNTER = "budget_counter"
PENDING = "pending_approval"
APPROVED = "active"


class BudgetActionError(ValueError):
    pass


def apply_budget_action(status: str, action: str, role: UserRole) -> str:
    if action == "propose":
        if role is not UserRole.FINANCE:
            raise BudgetActionError("Solo Finanzas carga el BAC")
        if status not in {AWAITING, COUNTER}:
            raise BudgetActionError("No hay solicitud de presupuesto abierta")
        return PROPOSED
    if action == "counter":
        if role is not UserRole.PMO:
            raise BudgetActionError("Solo el PM emite contrapropuesta")
        if status != PROPOSED:
            raise BudgetActionError("Debe existir propuesta de Finanzas")
        return COUNTER
    if action == "accept":
        if role is not UserRole.PMO:
            raise BudgetActionError("Solo el PM envía a validación comercial")
        if status not in {PROPOSED, COUNTER}:
            raise BudgetActionError("No hay cifra para validar")
        return PENDING
    if action == "approve":
        if role not in {UserRole.OWNER, UserRole.COMMERCIAL}:
            raise BudgetActionError("La validación final es de Comercial o Owner")
        if status != PENDING:
            raise BudgetActionError("El PM debe enviar el presupuesto a aprobación")
        return APPROVED
    raise BudgetActionError(f"Acción desconocida: {action}")
