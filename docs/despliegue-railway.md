# Despliegue público: GitHub + Railway

Guía para levantar OpenEVM en internet y **trabajar en la misma instancia** con un compañero. No sustituye el laboratorio de este PC (`npm run dev` / Docker Compose). No es la producción `main` + Supabase (Auth/RLS) prevista más adelante.

Sitio de Railway: [https://railway.app](https://railway.app)  
Documentación de monorepo: [Deploying a monorepo](https://docs.railway.com/guides/deploying-a-monorepo)

---

## Por qué Railway y no GitHub Pages / Netlify solo

OpenEVM no es un sitio estático. Hay tres procesos:

| Pieza | Qué es aquí | Por qué Pages no sirve |
|---|---|---|
| Código | GitHub `CrisLogOps/UNAB-EVM`, rama `Dev` | Pages **sí** guarda código; **no** ejecuta servidores |
| Web | Next.js en `apps/web` | Hace falta Node (`next start`) |
| API | FastAPI en `backend` | Hace falta Python 24/7 |
| Datos compartidos | Postgres | Sin esto cada uno tiene su `localStorage` y no ven la misma obra |

GitHub Actions construye o prueba; **no deja un API encendido**. Netlify cubre la landing de propuesta ([openevm.netlify.app](https://openevm.netlify.app/)), no FastAPI.

Railway conecta el **mismo repo de GitHub**, levanta **varios servicios** (web, API, Postgres) en un proyecto, asigna URLs `*.up.railway.app` y redespliega al hacer `git push` a la rama enlazada.

Supabase sigue siendo el destino de **producción de datos** del seminario (`docker-compose.prod.yml`). Para validar entre dos personas, el Postgres de Railway es suficiente y evita una cuenta más.

```text
tú ──push──► GitHub (Dev) ──deploy──► Railway
                                      ├── Postgres (datos compartidos)
                                      ├── api  (FastAPI)
                                      └── web  (Next.js)  ← URL que abre el compañero
```

---

## Qué vas a crear (un solo proyecto)

| Servicio en Railway | Origen | Root Directory | Dominio público |
|---|---|---|---|
| **Postgres** | Plugin de Railway | — | No (solo red interna; hay URL pública para migrar desde el PC) |
| **api** | Este repo | `/backend` | Sí (`https://….up.railway.app`) |
| **web** | Este repo | `/apps/web` | Sí (esta es la URL de la plataforma) |

---

## 0. Antes de abrir Railway

1. Cuenta en [GitHub](https://github.com) (ya existe el remoto `https://github.com/CrisLogOps/UNAB-EVM.git`).
2. El trabajo local tiene que estar en `origin/Dev`. Si hay cambios sin commit, **no** aparecerán en Railway.

```bash
cd /home/cristian/Documentos/UNAB/Seminarios/Grado2/UNAB-EVM
git status
git checkout Dev
# commit (cuando lo pidas) y:
git push -u origin Dev
```

3. Invita al compañero al repo (GitHub → Settings → Collaborators). Eso es el código. El **ambiente compartido** es Railway.

Railway ofrece crédito de prueba y luego un plan de pago menor (Hobby). Sin cuenta activa el deploy se apaga.

---

## 1. Crear cuenta y conectar GitHub

1. Entra a [https://railway.app](https://railway.app).
2. **Login with GitHub** (recomendado: un solo login).
3. Autoriza la app **Railway** a leer el repositorio `UNAB-EVM` (o todos los repos, si te resulta más simple).
4. Dashboard → **New project** → **Empty project**. Renómbralo p. ej. `openevm-dev`.

No uses “Deploy from template” de terceros.

---

## 2. Base de datos

1. En el canvas del proyecto: **+ New** → **Database** → **PostgreSQL**.
2. Espera a que el servicio quede verde.
3. Ábrelo → pestaña **Variables**. Verás `DATABASE_URL`. Esa variable se **referencia** en la API (paso 4); no la copies a GitHub.

La primera vez hay que crear las tablas del MVP. Desde **este PC** (con `psql` instalado):

```bash
cd /home/cristian/Documentos/UNAB/Seminarios/Grado2/UNAB-EVM
# En Railway → Postgres → Variables → copia DATABASE_URL (conexión pública)
export DATABASE_URL='postgresql://…'   # la que pegaste
./scripts/apply_db.sh
```

Si `psql` se queja de SSL, añade `?sslmode=require` al final de la URI (o `&sslmode=require` si ya hay `?`).

---

## 3. Servicio API (`backend`)

1. **+ New** → **GitHub Repo** → `CrisLogOps/UNAB-EVM`.
2. Settings del servicio:
   - **Name:** `api`
   - **Root Directory:** `backend`  
     (Railway usará `backend/Dockerfile`.)
   - **Watch paths** (opcional): `backend/**`
3. **Settings → Networking → Generate domain.** Anota la URL, p. ej. `https://openevm-api-production.up.railway.app`.
4. **Variables:**

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Referencia: `${{Postgres.DATABASE_URL}}` (elige el servicio Postgres del proyecto; el nombre puede ser `Postgres`) |
| `CORS_ORIGINS` | Dejar `http://localhost:3000` por ahora; **después** del paso 4 se cambia a la URL de la web |
| `API_DEBUG` | `false` |
| `MVP_TENANT_ID` | `mvp-demo` |

5. Deploy. Comprueba `https://<api>/health`: `"database": "up"`. Si sale `degraded`, la URI o el SSL no coinciden.

Railway inyecta `PORT`; el Dockerfile del API lo usa.

---

## 4. Servicio web (`apps/web`)

`NEXT_PUBLIC_API_URL` se **hornea en el build**. Hay que definirla **antes** (o redesplegar la web si cambias la API).

1. **+ New** → **GitHub Repo** → el **mismo** `UNAB-EVM`.
2. Settings:
   - **Name:** `web`
   - **Root Directory:** `apps/web`  
     (usa `apps/web/Dockerfile`.)
3. **Variables:**

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<dominio-público-de-api>` (sin barra final) |

En Railway puedes usar una variable de referencia cuando ya existe el dominio de `api`:

```text
NEXT_PUBLIC_API_URL=https://${{api.RAILWAY_PUBLIC_DOMAIN}}
```

4. **Generate domain** para `web`. Esa URL es la de la plataforma (Inicio, setup, etc.).
5. Vuelve al servicio **api** y actualiza:

```text
CORS_ORIGINS=https://${{web.RAILWAY_PUBLIC_DOMAIN}},http://localhost:3000
```

6. Redespliega **api** (CORS) y **web** si el primer build de Next se hizo sin `NEXT_PUBLIC_API_URL`.

---

## 5. Rama que dispara el deploy

En **api** y **web** → Settings → **Source**:

- Repositorio: `CrisLogOps/UNAB-EVM`
- Branch: **`Dev`** (no `main`)

Un `git push origin Dev` vuelve a construir esos servicios.

---

## 6. Cómo trabajan los dos

| Quién | Qué hace |
|---|---|
| Los dos | Abren la **URL de `web`** (no `localhost`) |
| Los dos | El snapshot se guarda en el **Postgres de Railway** vía la API |
| Código | PRs o push a `Dev`; Railway actualiza solo |
| Laboratorio local | Sigue en este PC; no pisa Railway salvo que apuntes `.env` a esas URLs |

Invitar al compañero a Railway: proyecto → **Settings → Members** (además del invite en GitHub).

Si la web carga pero el alta “no pega” entre navegadores: falta `NEXT_PUBLIC_API_URL` o CORS no incluye el dominio de `web`. En el navegador, pestaña Red, las llamadas deben ir a `https://…api…/api/v1/mvp/snapshot`.

---

## 7. Checklist de humo

- [ ] `git push origin Dev` tiene el código que quieren validar
- [ ] `https://<api>/health` → `database: up`
- [ ] `https://<web>/setup` abre el alta
- [ ] En un navegador creas tenant; en otro (o en el del compañero) recargas y **sigue** (no solo `localStorage` de un PC)
- [ ] CORS: la consola del navegador no muestra bloqueo de origen

---

## 8. Qué no hacer

- Subir `.env` o `DATABASE_URL` al repo.
- Enlazar Railway a `main` mientras el laboratorio vive en `Dev`.
- Usar `npm run dev` como comando de start en Railway (el Dockerfile de `apps/web` ya usa `next start`).
- Confundir este ambiente con producción `main` + Supabase Auth/RLS (bloque D/E). Cuando exista proyecto Supabase hosted, la API puede apuntar `DATABASE_URL` a esa URI; la receta local está en [`local-mvp.md`](./local-mvp.md).

---

## Coste y apagado

Railway cobra por uso (crédito de prueba, luego Hobby). Si se acaba el crédito, la URL deja de responder: no es un fallo del código. En el dashboard se puede **pausar** el proyecto al terminar una sesión de validación.

---

## Si algo falla

| Síntoma | Qué mirar |
|---|---|
| Build de `web` no encuentra `package.json` | Root Directory no es `apps/web` |
| Build de `api` no encuentra `Dockerfile` | Root Directory no es `backend` |
| Health `database: down` | `DATABASE_URL` no es la referencia a Postgres; SSL |
| Frontend sin datos compartidos | `NEXT_PUBLIC_API_URL` vacío o de un build viejo; redesplegar `web` |
| CORS error en el navegador | `CORS_ORIGINS` debe ser exactamente `https://<dominio-web>` |
| Deploy no arranca tras el push del compañero | Tiene que estar en el repo de GitHub **y** Railway debe tener a un miembro que apruebe deploys si pide Approval |
