from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator

import psycopg2
from psycopg2.extras import Json, RealDictCursor

from app.core.config import settings


def connect():
    return psycopg2.connect(settings.database_url)


@contextmanager
def db_cursor() -> Iterator[Any]:
    conn = connect()
    try:
        with conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                yield cur
    finally:
        conn.close()


def ping() -> bool:
    try:
        with db_cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        return True
    except Exception:
        return False


def fetch_snapshot(tenant_id: str) -> dict | None:
    with db_cursor() as cur:
        cur.execute(
            "SELECT payload FROM mvp_snapshots WHERE tenant_id = %s",
            (tenant_id,),
        )
        row = cur.fetchone()
    return dict(row["payload"]) if row else None


def upsert_snapshot(tenant_id: str, payload: dict, source: str = "web") -> dict:
    tenant = payload.get("tenant") or {}
    name = tenant.get("name") or "Tenant MVP"
    slug = tenant.get("slug") or tenant_id
    activity = tenant.get("activityType") or tenant.get("activity_type")
    size = tenant.get("companySize") or tenant.get("company_size")

    with db_cursor() as cur:
        cur.execute(
            """
            INSERT INTO mvp_tenants (id, name, slug, activity_type, company_size, updated_at)
            VALUES (%s, %s, %s, %s, %s, now())
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              slug = EXCLUDED.slug,
              activity_type = EXCLUDED.activity_type,
              company_size = EXCLUDED.company_size,
              updated_at = now()
            """,
            (tenant_id, name, slug, activity, size),
        )
        cur.execute(
            """
            INSERT INTO mvp_snapshots (tenant_id, payload, source, updated_at)
            VALUES (%s, %s, %s, now())
            ON CONFLICT (tenant_id) DO UPDATE SET
              payload = EXCLUDED.payload,
              source = EXCLUDED.source,
              updated_at = now()
            """,
            (tenant_id, Json(payload), source),
        )
        for project in payload.get("projects") or []:
            cur.execute(
                """
                INSERT INTO mvp_projects (id, tenant_id, client_id, name, code, status, kickoff_phase, payload, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, now())
                ON CONFLICT (id) DO UPDATE SET
                  tenant_id = EXCLUDED.tenant_id,
                  client_id = EXCLUDED.client_id,
                  name = EXCLUDED.name,
                  code = EXCLUDED.code,
                  status = EXCLUDED.status,
                  kickoff_phase = EXCLUDED.kickoff_phase,
                  payload = EXCLUDED.payload,
                  updated_at = now()
                """,
                (
                    project.get("id"),
                    tenant_id,
                    project.get("clientId") or project.get("client_id"),
                    project.get("name") or "Proyecto",
                    project.get("code"),
                    project.get("status"),
                    project.get("kickoffPhase") or project.get("kickoff_phase"),
                    Json(project),
                ),
            )
        for kickoff in payload.get("kickoffs") or []:
            kid = kickoff.get("id") or f"ko-{kickoff.get('projectId')}"
            cur.execute(
                """
                INSERT INTO mvp_kickoffs (id, tenant_id, project_id, verdict, payload, updated_at)
                VALUES (%s, %s, %s, %s, %s, now())
                ON CONFLICT (id) DO UPDATE SET
                  tenant_id = EXCLUDED.tenant_id,
                  project_id = EXCLUDED.project_id,
                  verdict = EXCLUDED.verdict,
                  payload = EXCLUDED.payload,
                  updated_at = now()
                """,
                (
                    kid,
                    tenant_id,
                    kickoff.get("projectId") or kickoff.get("project_id"),
                    kickoff.get("verdict"),
                    Json(kickoff),
                ),
            )
        for entry in payload.get("knowledge") or []:
            cur.execute(
                """
                INSERT INTO mvp_knowledge (
                  id, tenant_id, project_id, area_id, area_name, stance, comment, evidence_file_name, payload
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                  comment = EXCLUDED.comment,
                  stance = EXCLUDED.stance,
                  evidence_file_name = EXCLUDED.evidence_file_name,
                  payload = EXCLUDED.payload
                """,
                (
                    entry.get("id"),
                    tenant_id,
                    entry.get("projectId") or entry.get("project_id"),
                    entry.get("areaId") or entry.get("area_id"),
                    entry.get("areaName") or entry.get("area_name"),
                    entry.get("stance"),
                    entry.get("comment"),
                    entry.get("evidenceFileName") or entry.get("evidence_file_name"),
                    Json(entry),
                ),
            )
    return {"tenant_id": tenant_id, "ok": True}
