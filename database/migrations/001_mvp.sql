-- OpenEVM MVP — esquema compatible con PostgreSQL de Supabase.
-- Idempotente: se puede aplicar en Docker local o en el SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS mvp_tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  slug text,
  activity_type text,
  company_size text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mvp_snapshots (
  tenant_id text PRIMARY KEY REFERENCES mvp_tenants(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  source text NOT NULL DEFAULT 'web',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mvp_projects (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES mvp_tenants(id) ON DELETE CASCADE,
  client_id text,
  name text NOT NULL,
  code text,
  status text,
  kickoff_phase text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mvp_kickoffs (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES mvp_tenants(id) ON DELETE CASCADE,
  project_id text NOT NULL,
  verdict text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mvp_knowledge (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES mvp_tenants(id) ON DELETE CASCADE,
  project_id text,
  area_id text,
  area_name text,
  stance text,
  comment text,
  evidence_file_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mvp_projects_tenant_idx ON mvp_projects (tenant_id);
CREATE INDEX IF NOT EXISTS mvp_kickoffs_project_idx ON mvp_kickoffs (project_id);
CREATE INDEX IF NOT EXISTS mvp_knowledge_tenant_idx ON mvp_knowledge (tenant_id);

COMMENT ON TABLE mvp_snapshots IS 'Estado completo de apps/web (openevm.setup.v2) para el MVP.';
COMMENT ON TABLE mvp_kickoffs IS 'Kickoff interno/cliente extraído del snapshot para consulta en Studio.';
