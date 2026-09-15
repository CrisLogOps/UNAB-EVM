-- Datos de prueba del MVP. No borra filas existentes (ON CONFLICT DO NOTHING).

INSERT INTO mvp_tenants (id, name, slug, activity_type, company_size)
VALUES (
  'mvp-demo',
  'Constructora Demo MVP',
  'constructora-demo-mvp',
  'obras-civiles',
  'small'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mvp_snapshots (tenant_id, payload, source)
VALUES (
  'mvp-demo',
  $$
{
  "setupPhase": "done",
  "ownerManagesAll": true,
  "tenant": {
    "id": "mvp-demo",
    "name": "Constructora Demo MVP",
    "slug": "constructora-demo-mvp",
    "createdAt": "2026-09-01T12:00:00.000Z",
    "rut": "76.111.222-3",
    "activityType": "obras-civiles",
    "companySize": "small"
  },
  "clients": [
    {
      "id": "cli-demo",
      "tenantId": "mvp-demo",
      "name": "Cliente Validación SpA",
      "rut": "76.999.888-7",
      "contactName": "Ana Soto",
      "contactEmail": "ana.soto@cliente.cl",
      "createdAt": "2026-09-02T12:00:00.000Z"
    }
  ],
  "projects": [
    {
      "id": "prj-demo",
      "tenantId": "mvp-demo",
      "clientId": "cli-demo",
      "name": "Mejoramiento Ruta Demo",
      "code": "OBRA-MVP",
      "bac": 0,
      "startDate": "2026-10-01",
      "finishDate": "2027-03-31",
      "baselineStatus": "DRAFT",
      "baselineVersion": null,
      "currency": "CLP",
      "status": "draft_kickoff",
      "kickoffPhase": "awaiting_areas",
      "ufClp": 0,
      "usdClp": 0,
      "proposedBac": null,
      "counterBac": null,
      "budgetNote": ""
    }
  ],
  "kickoffs": [
    {
      "id": "ko-prj-demo",
      "projectId": "prj-demo",
      "clientId": "cli-demo",
      "commercialCommitment": "Mejoramiento de calzada y obras complementarias según extracto vendido.",
      "commercialConditions": "",
      "exclusions": "",
      "requirements": "Según propuesta inicial",
      "soldStartDate": "2026-10-01",
      "soldFinishDate": "2027-03-31",
      "commercialDeliveredBy": "u-founder",
      "commercialDeliveredAt": "2026-09-03T12:00:00.000Z",
      "proposal": {
        "title": "Propuesta inicial demo",
        "fileName": "",
        "fileType": "",
        "fileSize": 0,
        "uploadedBy": "u-founder",
        "uploadedAt": "2026-09-03T12:00:00.000Z",
        "body": "Alcance: mejoramiento de calzada, señalización y obras de drenaje. Plazo contractual octubre 2026 a marzo 2027. Exclusiones: expropiaciones y relocalización de servicios mayores. El kickoff interno debe validar capacidad, caja y terreno antes de reunirse con el cliente."
      },
      "areaReviews": [],
      "finalProposalToClient": "",
      "plannedStartDate": "2026-10-01",
      "plannedFinishDate": "2027-03-31",
      "siteStartDate": "",
      "legalAspects": "",
      "contractType": "",
      "guarantees": "",
      "permits": "",
      "workingAgreement": "",
      "teamValidatedUserIds": [],
      "internalDate": "",
      "internalNotes": "",
      "pmFit": "",
      "pmJudgment": "",
      "pmFulfillmentPlan": "",
      "pmValidatedBy": "",
      "pmValidatedAt": null,
      "internalConfirmedAt": null,
      "clientDate": "",
      "clientAttendees": "",
      "clientAgreements": "",
      "clientConfirmedAt": null
    }
  ],
  "knowledge": [],
  "invites": [],
  "users": [
    {
      "id": "u-founder",
      "name": "Administrador demo",
      "email": "admin@demo.cl",
      "role": "owner",
      "areaId": "area-dir",
      "profileId": "pf-owner",
      "active": true,
      "introSeen": true
    }
  ],
  "assignments": [
    {
      "id": "as-demo-1",
      "projectId": "prj-demo",
      "userId": "u-founder",
      "note": "Cubre el arranque del MVP"
    }
  ],
  "gantt": [],
  "reports": [],
  "profiles": [
    {
      "id": "pf-owner",
      "name": "Administrador",
      "role": "owner",
      "areaId": "area-dir",
      "description": "Arma la empresa, invita al equipo y mira cómo van las obras.",
      "componentIds": ["dashboard", "admin", "users", "profiles", "areas", "tenant", "clients", "projects", "gantt", "budget_propose", "budget_approve", "evidence", "progress", "knowledge"],
      "extraTaskIds": []
    }
  ],
  "areas": [
    {
      "id": "area-dir",
      "name": "Dirección",
      "role": "owner",
      "enabled": true,
      "headcount": 1,
      "description": "El representante legal arma el tenant y da el visto bueno."
    },
    {
      "id": "area-pmo",
      "name": "Área de gestión de proyectos",
      "role": "pmo",
      "enabled": true,
      "headcount": 1,
      "description": "Planifica obras, calendario y control de avance."
    },
    {
      "id": "area-fin",
      "name": "Área de Finanzas",
      "role": "finance",
      "enabled": true,
      "headcount": 1,
      "description": "Carga el presupuesto de la obra."
    },
    {
      "id": "area-ter",
      "name": "Área de Operaciones / Terreno",
      "role": "field",
      "enabled": true,
      "headcount": 1,
      "description": "Carga de evidencias y avance físico."
    }
  ],
  "sessionUserId": "u-founder",
  "projectId": "prj-demo"
}
  $$::jsonb,
  'seed'
)
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO mvp_projects (id, tenant_id, client_id, name, code, status, kickoff_phase, payload)
VALUES (
  'prj-demo',
  'mvp-demo',
  'cli-demo',
  'Mejoramiento Ruta Demo',
  'OBRA-MVP',
  'draft_kickoff',
  'awaiting_areas',
  '{"seed": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mvp_kickoffs (id, tenant_id, project_id, verdict, payload)
VALUES (
  'ko-prj-demo',
  'mvp-demo',
  'prj-demo',
  'incomplete',
  '{"seed": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
