# Evaluación mínima — servidor para desplegar y validar el MVP

Documento para **solicitar un servidor** (VM, VPS o máquina de laboratorio) con los antecedentes necesarios para **subir OpenEVM**, **correr el MVP** y **validar funcionalidades** con evaluadores o compañeros.

No sustituye el laboratorio local (`docker compose` / `npm run dev`) ni el despliegue compartido en Railway ([despliegue-railway.md](./despliegue-railway.md)). Sirve como **ficha de requisitos** para TI, hosting académico o un proveedor de VPS.

| | |
|---|---|
| Producto | OpenEVM (`UNAB-EVM`) |
| Rama a desplegar | `Dev` (laboratorio); `staging` si el servidor es de validación previa a `main` |
| Objetivo | Una URL pública (o de red interna) con web + API + Postgres, para probar el alta, el flujo F0–F7 operable y el snapshot compartido |
| Fuera de este pedido | Auth/RLS de producción (Supabase), PWA offline-first, Streamlit, dominio de marketing |

---

## 1. Qué se pide, en una frase

Un **Linux LTS con Docker**, **2 vCPU / 4 GB RAM / 40 GB disco** (recomendado **8 GB RAM**), puertos **80/443** (y opcionalmente 22), para montar **tres procesos**: Next.js, FastAPI y PostgreSQL 15. Con eso se valida el MVP actual. El destino de datos de producción del seminario sigue siendo **Supabase** (misma familia: PostgreSQL).

---

## 2. Arquitectura de software (MVP desplegable)

El código que **hoy** se sube a un servidor no es el diseño objetivo completo de Fase 2 (Streamlit + PWA en [architecture.md](./architecture.md)). El MVP operable es:

```text
Evaluador / profesional
        │  HTTPS
        ▼
┌───────────────────────┐
│  Web  · Next.js 15    │  apps/web   · puerto 3000 (o 443 vía proxy)
│  React 19 · TypeScript│  PWA manifest (instalable); captura offline completa: diferida
└───────────┬───────────┘
            │ REST  NEXT_PUBLIC_API_URL
            ▼
┌───────────────────────┐
│  API  · FastAPI       │  backend    · puerto 8000 (interno o 443)
│  Python 3.12          │  reglas, health, snapshot MVP
└───────────┬───────────┘
            │ SQL  DATABASE_URL
            ▼
┌───────────────────────┐
│  PostgreSQL 15        │  database/migrations + seeds
│  (Docker o Supabase)  │  mvp_tenants, mvp_snapshots, mvp_projects, …
└───────────────────────┘
```

| Capa | Rol en el MVP | Dónde vive |
|---|---|---|
| **Web** | Alta (login/setup), Inicio, clientes, kickoff, calendario, presupuesto, avance, evidencias, gastos | `apps/web` |
| **API** | Persistencia del snapshot, health, CORS | `backend` |
| **Datos** | Estado compartido entre navegadores / evaluadores | Postgres 15 (contenedor o URI Supabase) |
| **Proxy** (recomendado en el servidor) | TLS y un solo origen público | nginx o Caddy delante de web + api |

Sin Postgres, cada navegador queda en `localStorage` y **no** se puede validar el mismo tenant entre dos personas.

### Diseño objetivo (no pedir en este servidor mínimo)

Queda documentado en ADRs; **no** forma parte del sizing de este pedido:

- Streamlit (Owner / PMO dashboard-first)
- PWA terreno offline-first + GPS + cola IndexedDB
- Supabase Auth + Storage + RLS estricto
- Candados F30 / retenciones como módulos de servidor cerrados

Cuando existan, suben CPU/RAM y aparece **object storage** para fotos. El servidor de esta ficha ya deja el camino: misma API y mismo PostgreSQL.

---

## 3. Lenguajes, runtimes y diseño de código

| Pieza | Lenguaje | Runtime / framework | Cómo se construye en el servidor |
|---|---|---|---|
| Plataforma | **TypeScript** | **Node.js 22**, Next.js 15, React 19, Tailwind 4 | `apps/web/Dockerfile` → `npm ci` + `next build` + `next start` |
| API | **Python 3.12** | FastAPI, Uvicorn, Pydantic 2, psycopg2 | `backend/Dockerfile` → `pip install -r requirements.txt` + Uvicorn |
| Datos | **SQL** + **JSON** (`jsonb`) | PostgreSQL 15 | `database/migrations/001_mvp.sql` y seed `002_mvp_demo.sql` |
| Orquestación | YAML | Docker Compose | `docker-compose.yml` (+ `docker-compose.prod.yml` si la URI es Supabase) |

Dependencias Python relevantes del MVP: FastAPI, Uvicorn, Pydantic, psycopg2, python-multipart. El cliente `supabase` está en `requirements.txt` para la ola de producción; el MVP actual habla Postgres por `DATABASE_URL`.

**No** hace falta instalar Node/Python en el host si se usa solo Docker. Sí hace falta Docker Engine + Compose v2.

---

## 4. Base de datos (requisito mínimo)

| Ítem | Valor |
|---|---|
| Motor | **PostgreSQL 15** (imagen `postgres:15` o proyecto Supabase equivalente) |
| Encoding | UTF-8 |
| Extensiones | Ninguna obligatoria en el MVP (sin PostGIS todavía) |
| Esquema MVP | Tablas `mvp_tenants`, `mvp_snapshots`, `mvp_projects`, `mvp_kickoffs`, `mvp_knowledge` |
| Volumen | Disco persistente (Docker volume o disco del VPS); **no** ephemeral |
| Backup | Snapshot semanal o `pg_dump` basta para evaluación académica |
| Acceso | Solo red interna del host (API). No exponer `5432` a Internet |
| Seed | `mvp-demo` opcional para demo; evaluadores pueden hacer alta propia |

Tamaño de datos del MVP: bajo (JSON de snapshot por tenant). **2–5 GB** de disco para Postgres alcanzan la evaluación. El resto del disco cubre imágenes Docker, build de Next y logs.

Evidencias (fotos/PDF) en el MVP actual viajan sobre todo en el cliente; un disco extra o bucket S3/Supabase Storage **no** es bloqueante para esta solicitud, pero conviene **dejar 10 GB libres** para adjuntos cuando se active Storage.

---

## 5. Requisitos mínimos del servidor (solicitud)

### 5.1 Hardware (una sola VM con los tres servicios)

| Recurso | Mínimo para validar | Recomendado (builds en la misma máquina) |
|---|---|---|
| vCPU | **2** | 4 |
| RAM | **4 GB** | **8 GB** |
| Swap | 2 GB si RAM = 4 GB | 2 GB |
| Disco | **40 GB SSD** | 60 GB SSD |
| Arquitectura | x86_64 | x86_64 |

El **build de Next.js 15** es el cuello de botella de memoria. Con 2 GB RAM el `npm run build` suele fallar (OOM). Si el servidor tiene 2 GB, hay que **construir la imagen web en otro equipo** y solo correr `next start` en el VPS.

### 5.2 Sistema operativo y red

| Ítem | Mínimo |
|---|---|
| OS | Ubuntu 22.04 o 24.04 LTS (Debian 12 aceptable) |
| Acceso | SSH (clave o usuario del laboratorio) |
| Puertos públicos | **80** y **443** (HTTPS). SSH **22** restringido |
| Puertos internos | 3000 (web), 8000 (API), 5432 (Postgres, solo localhost) |
| Dominio | Un hostname (o IP fija). Ideal: `app.` y `api.` o un reverse proxy con paths |
| TLS | Certificado (Let’s Encrypt) o TLS del campus |
| Salida a Internet | Necesaria **al menos en el build**: imágenes Docker, npm, PyPI |

### 5.3 Software en el host

| Software | Versión mínima | Para qué |
|---|---|---|
| Docker Engine | 24+ | Contenedores web, api, db |
| Docker Compose | v2 | `docker compose up` |
| Git | 2.x | Clonar `UNAB-EVM` rama `Dev` |
| curl | cualquier | Health check |
| (Opcional) nginx o Caddy | estable | HTTPS y unificar orígenes |

### 5.4 Variables de entorno (no van al Git)

| Variable | Servicio | Ejemplo / nota |
|---|---|---|
| `DATABASE_URL` | API | `postgresql://usuario:clave@db:5432/postgres` |
| `CORS_ORIGINS` | API | Origen exacto de la web, p. ej. `https://openevm.ejemplo.cl` |
| `API_DEBUG` | API | `false` en el servidor de evaluación |
| `MVP_TENANT_ID` | API | `mvp-demo` |
| `NEXT_PUBLIC_API_URL` | Web (**build-time**) | URL pública de la API, sin barra final |
| `PORT` | API / Web | Lo inyecta el orquestador; por defecto 8000 / 3000 |

`NEXT_PUBLIC_API_URL` se **hornea en el build**. Si cambia el dominio de la API, hay que **reconstruir** la web.

---

## 6. Cómo se despliega (resumen para quien opera el servidor)

```bash
git clone <remoto-UNAB-EVM> && cd UNAB-EVM
git checkout Dev

# Evaluación con Postgres en el mismo servidor
docker compose up -d --build
# Web:  http://<host>:3000
# API:  http://<host>:8000/health
# DB:   localhost:54322 (solo si se publica el puerto; en evaluación mejor no)

# Evaluación contra Postgres hosted (Supabase)
export SUPABASE_DB_URL='postgresql://…'
export CORS_ORIGINS='https://<dominio-web>'
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Migraciones: en Compose local se aplican al crear el volumen. En una URI externa:

```bash
export DATABASE_URL='postgresql://…'
./scripts/apply_db.sh
```

Detalle de un PaaS equivalente: [despliegue-railway.md](./despliegue-railway.md). Arranque local: [local-mvp.md](./local-mvp.md).

---

## 7. Qué se valida en ese servidor (funcionalidades mínimas)

Checklist para dar por **aceptable** el despliegue (no es el alcance completo del libro Rev3):

| # | Prueba | Criterio de éxito |
|---|---|---|
| 1 | Salud API | `GET /health` → base `up` |
| 2 | Entrada | `https://<web>/login` carga OpenEVM |
| 3 | Alta | Setup 0 (cuenta + empresa + modo individual o colaborativo) |
| 4 | Persistencia | Recargar u otro navegador **conserva** el tenant (snapshot en Postgres, no solo `localStorage`) |
| 5 | CORS | La consola no bloquea llamadas a la API |
| 6 | Obra | Cliente + proyecto + kickoff operable según el modo |
| 7 | Plan / control | Calendario y/o presupuesto según el flujo de Inicio |
| 8 | Evidencia | Se puede **registrar un respaldo** ligado a la obra (repositorio para el cliente / contrato) |
| 9 | EVM | Inicio muestra el ciclo y, con datos, indicadores de control |
| 10 | Colaborativo visible | El independiente ve el puente a perfiles / invitaciones / modo equipo (aunque trabaje solo) |

Si 1–5 fallan, el servidor no sirve para evaluar el producto. 6–10 son la validación de negocio del MVP.

---

## 8. Texto listo para la solicitud (copiar)

> **Solicitud:** servidor de evaluación para el MVP OpenEVM (Seminario de Grado UNAB).
>
> **Uso:** desplegar una instancia web + API + PostgreSQL para validar el alta de empresa, el flujo de obra y un snapshot compartido entre evaluadores.
>
> **Sistema:** Ubuntu 22.04/24.04 LTS, x86_64, Docker Engine + Compose, Git, acceso SSH.
>
> **Capacidad mínima:** 2 vCPU, 4 GB RAM (8 GB recomendado), 40 GB SSD, swap 2 GB, salida a Internet para construir imágenes.
>
> **Red:** IP o hostname estable; puertos 80 y 443 públicos; SSH restringido. No exponer PostgreSQL a Internet. Certificado TLS o reverse proxy del campus.
>
> **Stack a instalar (contenedores, no en el host):** Node.js 22 / Next.js 15 (TypeScript), Python 3.12 / FastAPI, PostgreSQL 15.
>
> **Persistencia:** volumen de disco para Postgres. Variables `DATABASE_URL`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL` fuera del repositorio.
>
> **Criterio de entrega:** `GET /health` con base arriba y la URL de la web permitiendo login, alta y recarga con datos conservados.
>
> **Duración estimada:** el período de evaluación del seminario (apagable al cerrar). Backup: `pg_dump` semanal.

---

## 9. Relación con otros documentos

| Documento | Relación |
|---|---|
| [architecture.md](./architecture.md) | ADRs y diseño objetivo (PWA, Supabase, Streamlit) |
| [local-mvp.md](./local-mvp.md) | Cómo se levanta lo mismo en el PC de desarrollo |
| [despliegue-railway.md](./despliegue-railway.md) | Alternativa PaaS si no hay VM del campus |
| [flujo-fases-f1-f7.md](./flujo-fases-f1-f7.md) | Qué funcionalidades pertenecen al flujo válido |
| [business-rules.md](./business-rules.md) | Candados de dominio (olas posteriores al MVP de evaluación) |
