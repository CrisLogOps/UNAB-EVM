"""Catálogo de permisos y navegación por rol (enforcement real vive en API)."""

from __future__ import annotations

from .entities import UserRole

PERMISSIONS: dict[UserRole, frozenset[str]] = {
    UserRole.OWNER: frozenset(
        {
            "user:manager",
            "tenant:settings",
            "project:staff",
            "evm.read",
            "alerts.read",
            "schedule:view",
            "cost:view",
            "cost:approve",
            "project:approve",
            "budget:approve",
        }
    ),
    UserRole.PMO: frozenset(
        {
            "project:manager",
            "schedule:edit",
            "schedule:view",
            "baseline.upload",
            "baseline.draft.edit",
            "baseline.freeze",
            "baseline.replan",
            "baseline.read",
            "evidence.approve",
            "evm.read",
            "alerts.read",
            "progress.cut.approve",
            "cost:approve",
            "budget:counter",
        }
    ),
    UserRole.ADMIN_OBRA: frozenset(
        {
            "baseline.read",
            "evm.read",
            "alerts.read",
            "labor.lock.read",
            "finance.retention.read",
        }
    ),
    UserRole.FINANCE: frozenset(
        {
            "baseline.read",
            "evm.read",
            "budget:propose",
            "cost.ac_upload",
            "labor.f30.upload",
            "labor.f30.approve",
            "finance.ep.process",
        }
    ),
    UserRole.COMMERCIAL: frozenset(
        {
            "evm.read",
            "alerts.read",
            "budget:approve",
            "cost:view",
            "schedule:view",
        }
    ),
    UserRole.OFICINA_TECNICA: frozenset(
        {
            "baseline.upload",
            "baseline.draft.edit",
            "baseline.read",
            "evidence.upload",
            "evidence.approve",
            "evm.read",
        }
    ),
    UserRole.WAREHOUSE: frozenset({"inventory:dispatch", "evm.read"}),
    UserRole.FIELD: frozenset(
        {
            "progress.submit",
            "evidence.upload",
            "cost.ac_upload",
            "baseline.read",
            "evm.read",
        }
    ),
    UserRole.SUBCONTRACTOR: frozenset({"evidence.upload", "inventory:request", "evm.read"}),
    UserRole.VIEWER: frozenset({"baseline.read", "evm.read", "alerts.read"}),
}

NAV_ITEMS: dict[UserRole, tuple[tuple[str, str], ...]] = {
    UserRole.OWNER: (
        ("/demo", "Dashboard"),
        ("/admin", "Administración"),
        ("/budget-approval", "Validar presupuestos"),
        ("/users", "Usuarios"),
        ("/profiles", "Perfiles"),
        ("/teams", "Equipos"),
        ("/areas", "Áreas y puestos"),
        ("/tenant", "Datos del tenant"),
    ),
    UserRole.PMO: (
        ("/demo", "Dashboard"),
        ("/projects", "Proyectos"),
        ("/gantt", "Carta Gantt"),
        ("/budget-review", "Validar presupuesto"),
        ("/cuts", "Cortes de control"),
        ("/evidence", "Evidencias"),
    ),
    UserRole.ADMIN_OBRA: (("/demo", "Dashboard"),),
    UserRole.FINANCE: (
        ("/demo", "Dashboard"),
        ("/budget", "Presupuesto de obras"),
        ("/finance", "Estados de pago"),
    ),
    UserRole.COMMERCIAL: (("/demo", "Dashboard"), ("/budget-approval", "Validar presupuestos")),
    UserRole.WAREHOUSE: (("/demo", "Dashboard"),),
    UserRole.OFICINA_TECNICA: (("/demo", "Dashboard"), ("/evidence", "Evidencias")),
    UserRole.FIELD: (
        ("/progress", "Registrar avance"),
        ("/costs", "Imputar AC"),
    ),
    UserRole.SUBCONTRACTOR: (("/progress", "Reportar avance"),),
    UserRole.VIEWER: (("/demo", "Dashboard"),),
}


def has_permission(role: UserRole, permission: str) -> bool:
    return permission in PERMISSIONS.get(role, frozenset())
