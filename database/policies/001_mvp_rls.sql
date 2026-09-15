-- Políticas para el proyecto hosted de Supabase (SQL Editor).
-- En local, FastAPI usa el rol postgres (bypass RLS). No ejecutar DROP.

ALTER TABLE mvp_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_kickoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mvp_knowledge ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mvp_tenants_read ON mvp_tenants;
CREATE POLICY mvp_tenants_read ON mvp_tenants FOR SELECT USING (true);

DROP POLICY IF EXISTS mvp_snapshots_read ON mvp_snapshots;
CREATE POLICY mvp_snapshots_read ON mvp_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS mvp_projects_read ON mvp_projects;
CREATE POLICY mvp_projects_read ON mvp_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS mvp_kickoffs_read ON mvp_kickoffs;
CREATE POLICY mvp_kickoffs_read ON mvp_kickoffs FOR SELECT USING (true);

DROP POLICY IF EXISTS mvp_knowledge_read ON mvp_knowledge;
CREATE POLICY mvp_knowledge_read ON mvp_knowledge FOR SELECT USING (true);

-- Escritura: solo service_role / FastAPI con DATABASE_URL (service).
-- El anon key del browser no escribe; la web habla con FastAPI.
