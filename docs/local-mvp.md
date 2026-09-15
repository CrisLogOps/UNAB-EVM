# Ambiente local (desarrollo) y Supabase (producción)

Hay dos ambientes:

| Ambiente | Cómo se levanta | Base de datos | Para quién |
|---|---|---|---|
| **Desarrollo** | `docker compose up` | Postgres en Docker (`localhost:54322`) | Trabajo diario en este equipo |
| **Producción** | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` | **Supabase** hosted | Validación de terceros |

La plataforma (Next.js + FastAPI) es la misma. Cambia solo dónde se persiste el snapshot del MVP.

## Desarrollo local (Docker Compose)

```bash
cd UNAB-EVM
./scripts/run_local.sh
```

Eso monta **db + api + web**. Abrir [http://localhost:3000/demo](http://localhost:3000/demo).

Si ya tenías `npm run dev` en el puerto 3000, deténlo para que el contenedor `openevm-web` pueda usar ese puerto.

- API: [http://localhost:8000/health](http://localhost:8000/health)
- Snapshot: [http://localhost:8000/api/v1/mvp/snapshot](http://localhost:8000/api/v1/mvp/snapshot)

Si el navegador ya tenía OpenEVM en `localStorage`, ese estado se sube al Postgres de desarrollo. Ventana privada carga el seed `mvp-demo`.

## Producción en Supabase (terceros)

1. En el SQL Editor de Supabase (o con la URI):

```bash
export DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-0-….pooler.supabase.com:5432/postgres'
./scripts/apply_db.sh
```

Archivos: `database/migrations/001_mvp.sql` y `database/seeds/002_mvp_demo.sql`. No borra tablas ajenas.

2. Levantar API + web contra esa base (sin Postgres local):

```bash
export SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@…supabase.com:5432/postgres'
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Los terceros validan el mismo producto; los datos viven en Supabase.

## Kickoff interno (qué se pide)

Las áreas involucradas registran **razones por escrito**. Un archivo de respaldo es **opcional**. Con esos comentarios el gestor cierra el kickoff interno y recién ahí se abre el kickoff con el cliente.

## Puertos

| Servicio | Puerto |
|---|---|
| Plataforma (Next.js) | 3000 |
| FastAPI | 8000 |
| Postgres local (solo desarrollo) | 54322 |
