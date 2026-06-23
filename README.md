# CofradeNet — Guía completa de despliegue

Plataforma de gestión cofrade: **frontend (Next.js en Vercel)**, **backend (NestJS en Render)**, **base de datos (Supabase/PostgreSQL)** y **media (Cloudflare R2)**.

Esta guía cubre el despliegue **de principio a fin** con el stack gratuito recomendado:

| Herramienta | Rol | URL |
|-------------|-----|-----|
| **GitHub** | Repositorio y CI/CD | https://github.com |
| **Supabase** | PostgreSQL en la nube | https://supabase.com |
| **Cloudflare R2** | Almacenamiento de imágenes/vídeos | https://dash.cloudflare.com |
| **Render** | Backend NestJS (API) | https://render.com |
| **Vercel** | Frontend Next.js | https://vercel.com |
| **Podman** *(opcional)* | PostgreSQL local para desarrollo | — |

---

## Arquitectura en producción

```mermaid
flowchart LR
    subgraph usuario [Usuario]
        Browser[Navegador]
    end

    subgraph vercel [Vercel]
        Web[Next.js — Frontend]
    end

    subgraph cf [Cloudflare]
        R2[R2 — Media binaria]
    end

    subgraph render [Render]
        API[NestJS API]
    end

    subgraph supabase [Supabase]
        PG[(PostgreSQL)]
    end

    Browser --> Web
    Browser --> API
    API --> PG
    API --> R2
    Web -.->|NEXT_PUBLIC_API_URL| API
```

**Flujo de archivos:**

1. El usuario sube una imagen → el backend la guarda en **R2**.
2. El backend crea un registro en **PostgreSQL** (tabla `archivos`).
3. El frontend muestra la imagen con `GET https://tu-api.onrender.com/archivos/{uuid}`.

---

## Requisitos previos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Cloudflare](https://dash.cloudflare.com) (solo R2)
- Cuenta en [Render](https://render.com)
- Cuenta en [Vercel](https://vercel.com)
- **Node.js 20+** y **npm** instalados en tu máquina
- *(Desarrollo local)* [Podman](https://podman.io) o Docker

---

## Paso 0 — Preparar el repositorio

### 0.1 Clonar e instalar dependencias

```bash
git clone https://github.com/TU_USUARIO/app-cofradenet.git
cd app-cofradenet

cp config/.env.example config/.env
# Edita config/.env con tus valores locales

cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 0.2 Subir a GitHub

```bash
git add .
git commit -m "Preparar despliegue en producción"
git push -u origin main
```

> Todos los servicios en la nube se conectarán a este repositorio.

---

## Paso 1 — Supabase (base de datos PostgreSQL)

Supabase aloja todos los datos de la aplicación: usuarios, hermandades, procesiones, referencias a archivos, etc.

### 1.1 Crear el proyecto

1. Entra en https://supabase.com y haz clic en **Start your project**.
2. **New project**:
   - **Name:** `cofradenet`
   - **Database Password:** genera una contraseña segura y **guárdala**.
   - **Region:** elige la más cercana (ej. `West EU (Paris)`).
3. Espera 1–2 minutos a que el proyecto esté listo.

### 1.2 Activar la extensión `unaccent`

La búsqueda global (`/search`) la necesita.

1. En el dashboard: **SQL Editor** → **New query**.
2. Pega y ejecuta:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

*(El mismo SQL está en `config/supabase/init.sql`.)*

### 1.3 Obtener la connection string

1. **Settings** (icono engranaje) → **Database**.
2. En **Connection string**, pestaña **URI**.
3. Elige el modo **Transaction** (recomendado para Render; usa el pooler en puerto `6543`).
4. Sustituye `[YOUR-PASSWORD]` por tu contraseña.
5. Copia la URL. Tendrá un aspecto similar a:

```
postgresql://postgres.abcdefghijklmnop:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

> **Importante:** usa el pooler (`pooler.supabase.com:6543`), no la conexión directa (`db.xxx.supabase.co:5432`), para evitar agotar conexiones en Render.

### 1.4 Guardar la variable

La usarás en Render como `DATABASE_URL`. No la subas al repositorio.

---

## Paso 2 — Cloudflare R2 (almacenamiento de media)

R2 guarda los binarios: logos, fotos de procesiones, vídeos, etc. El plan gratuito incluye **10 GB**.

### 2.1 Crear el bucket

1. https://dash.cloudflare.com → menú lateral **R2**.
2. Si es la primera vez, activa R2 (puede pedir método de pago; no se cobra dentro del tier gratuito).
3. **Create bucket**:
   - **Bucket name:** `cofradenet-media`
   - **Location:** Automatic
4. **Create bucket**.

### 2.2 Crear API Token

1. En R2 → **Manage R2 API Tokens** → **Create API token**.
2. Configuración:
   - **Token name:** `cofradenet-backend`
   - **Permissions:** **Object Read & Write**
   - **Specify bucket(s):** solo `cofradenet-media`
3. **Create API Token**.
4. Guarda estos tres valores (solo se muestran una vez):
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (también visible en **R2 → Overview**)

### 2.3 Variables para el backend

| Variable | Ejemplo |
|----------|---------|
| `MEDIA_STORAGE_PROVIDER` | `r2` |
| `R2_ACCOUNT_ID` | `a1b2c3d4e5f6...` |
| `R2_ACCESS_KEY_ID` | `abc123...` |
| `R2_SECRET_ACCESS_KEY` | `xyz789...` |
| `R2_BUCKET_NAME` | `cofradenet-media` |

> Los archivos se sirven a través del backend (`GET /archivos/:id`). No hace falta dominio público en R2 para empezar.

---

## Paso 3 — Render (backend NestJS)

Render aloja la API REST. El plan **Free** es suficiente para empezar (el servicio se duerme tras inactividad; la primera petición puede tardar ~30 s).

### 3.1 Crear el Web Service

**Opción A — Blueprint (recomendada)**

1. https://dashboard.render.com → **New +** → **Blueprint**.
2. Conecta tu repositorio de GitHub.
3. Render detectará `render.yaml` en la raíz.
4. Revisa el servicio `cofradenet-api` y haz clic en **Apply**.

**Opción B — Manual**

1. **New +** → **Web Service**.
2. Conecta el repositorio.
3. Configuración:

| Campo | Valor |
|-------|-------|
| **Name** | `cofradenet-api` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start:prod` |
| **Plan** | `Free` |

### 3.2 Variables de entorno en Render

En el servicio → **Environment** → añade:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Cadena aleatoria larga (ej. `openssl rand -base64 32`) |
| `DATABASE_URL` | URI de Supabase (paso 1.3) |
| `MEDIA_STORAGE_PROVIDER` | `r2` |
| `R2_ACCOUNT_ID` | Tu Account ID de Cloudflare |
| `R2_ACCESS_KEY_ID` | Access Key del token R2 |
| `R2_SECRET_ACCESS_KEY` | Secret Key del token R2 |
| `R2_BUCKET_NAME` | `cofradenet-media` |
| `FRONTEND_URL` | URL de Vercel (la tendrás tras el paso 4; ej. `https://cofradenet.vercel.app`) |

> `PORT` lo inyecta Render automáticamente. No lo definas manualmente.

### 3.3 Desplegar

1. **Manual Deploy** → **Deploy latest commit** (o espera el deploy automático al hacer push).
2. Cuando termine, anota la URL: `https://cofradenet-api.onrender.com` (o la que te asigne Render).

### 3.4 Verificar que la API responde

```bash
curl https://cofradenet-api.onrender.com/health
# Respuesta esperada: {"status":"ok"}
```

Documentación interactiva: `https://cofradenet-api.onrender.com/docs`

### 3.5 Ejecutar el seed (datos iniciales)

El seed crea ~8000 ciudades y el usuario admin.

1. En Render → tu servicio → **Shell** (pestaña).
2. Ejecuta:

```bash
npm run seed
```

3. Credenciales admin por defecto (cámbialas en producción):
   - **Email:** `admin@test.com`
   - **Password:** `adminpass`

> TypeORM crea las tablas automáticamente (`synchronize: true`) en el primer arranque con `DATABASE_URL` configurada.

### 3.6 Alternativa: despliegue con Docker

Si prefieres Docker en lugar del runtime Node de Render:

```bash
cd backend
docker build -t cofradenet-api .
docker run -p 3000:3000 --env-file ../config/.env cofradenet-api
```

---

## Paso 4 — Vercel (frontend Next.js)

Vercel aloja el frontend Next.js. El plan **Hobby** (gratuito) es suficiente para proyectos personales.

### 4.1 Importar el proyecto

1. https://vercel.com → **Add New…** → **Project**.
2. **Import** tu repositorio de GitHub (`app-cofradenet`).
3. Configuración del proyecto:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Next.js *(detectado automáticamente)* |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` *(por defecto)* |
| **Output Directory** | `.next` *(por defecto)* |
| **Install Command** | `npm install` *(por defecto)* |

### 4.2 Variables de entorno en Vercel

Antes del primer deploy, en **Environment Variables**, añade:

| Variable | Valor | Entornos |
|----------|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://cofradenet-api.onrender.com` | Production, Preview, Development |

> `NEXT_PUBLIC_*` se embebe en el bundle en tiempo de build. Si cambias la URL de la API, haz **Redeploy**.

El frontend la consume en `frontend/src/lib/api.ts`:

```typescript
const direct = process.env.NEXT_PUBLIC_API_URL;
// ...
export const API = resolveApiUrl();
```

### 4.3 Desplegar

1. Haz clic en **Deploy**.
2. Espera a que termine el build (1–3 min).
3. Vercel asigna una URL como:

```
https://cofradenet.vercel.app
```

### 4.4 Actualizar CORS en Render

Vuelve a Render → **Environment** y actualiza `FRONTEND_URL`:

```
FRONTEND_URL=https://cofradenet.vercel.app
```

Si también quieres desarrollo local contra la API en la nube:

```
CORS_ORIGINS=https://cofradenet.vercel.app,http://localhost:4000
```

> Incluye también las URLs de **preview** de Vercel si las usas (ej. `https://cofradenet-git-main-tu-usuario.vercel.app`).

Guarda y espera el redeploy automático de Render.

### 4.5 Dominio personalizado (opcional)

1. Vercel → tu proyecto → **Settings** → **Domains**.
2. Añade tu dominio y configura los registros DNS que indique Vercel.
3. Actualiza `FRONTEND_URL` en Render con el nuevo dominio.

### 4.6 Despliegues automáticos

Cada `git push` a `main` despliega en producción. Los pull requests generan **Preview Deployments** con URL propia.

Para que los previews funcionen con la API, `NEXT_PUBLIC_API_URL` debe estar definida también en el entorno **Preview** (paso 4.2).

---

## Paso 5 — Verificación final

Checklist cuando todo esté desplegado:

- [ ] `curl https://TU-API.onrender.com/health` → `{"status":"ok"}`
- [ ] `https://TU-API.onrender.com/docs` → Swagger carga
- [ ] Frontend en Vercel carga sin errores en consola
- [ ] Login con `admin@test.com` / `adminpass` funciona
- [ ] Búsqueda global (`/search`) no devuelve error 500 (extensión `unaccent` activa)
- [ ] Subir un logo o imagen y comprobar que se visualiza

---

## Desarrollo local (opcional)

Para trabajar en tu máquina sin usar Supabase ni R2:

### Base de datos local con Podman

```bash
# Desde la raíz del proyecto
cp config/.env.example config/.env
# Usa DB_* locales; NO definas DATABASE_URL

npm run db:up      # Levanta PostgreSQL 16
npm run db:seed    # Datos iniciales
```

### Arrancar backend y frontend

```bash
# Terminal 1
npm run dev:backend

# Terminal 2
npm run dev:frontend
```

| Servicio | URL local |
|----------|-----------|
| API | http://localhost:3000 |
| Frontend | http://localhost:4000 |
| Swagger | http://localhost:3000/docs |

### Variables locales (`config/.env`)

```env
APP_HOST=localhost
FRONTEND_PORT=4000
BACKEND_PORT=3000
NODE_ENV=development

JWT_SECRET=tu_secreto_local

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_NAME=cofradenet_db

MEDIA_STORAGE_PROVIDER=local
```

Con `MEDIA_STORAGE_PROVIDER=local` los archivos se guardan en `backend/uploads/` (sin R2).

> En local el script `frontend/scripts/with-env.mjs` lee `config/.env` y construye `NEXT_PUBLIC_API_URL` automáticamente. No hace falta definirla a mano.

---

## Referencia de variables de entorno

### Backend (Render / local)

| Variable | Desarrollo | Producción | Obligatoria |
|----------|------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Sí |
| `JWT_SECRET` | Secreto local | Secreto fuerte | Sí |
| `DATABASE_URL` | — | URI Supabase | Prod: sí |
| `DB_HOST` | `localhost` | — | Local: sí |
| `DB_PORT` | `5432` | — | Local: sí |
| `DB_USERNAME` | `postgres` | — | Local: sí |
| `DB_PASSWORD` | tu password | — | Local: sí |
| `DB_NAME` | `cofradenet_db` | — | Local: sí |
| `MEDIA_STORAGE_PROVIDER` | `local` | `r2` | Sí |
| `R2_ACCOUNT_ID` | — | Account ID | Con R2: sí |
| `R2_ACCESS_KEY_ID` | — | Access Key | Con R2: sí |
| `R2_SECRET_ACCESS_KEY` | — | Secret Key | Con R2: sí |
| `R2_BUCKET_NAME` | — | `cofradenet-media` | Con R2: sí |
| `FRONTEND_URL` | — | URL de Vercel | Prod: sí |
| `CORS_ORIGINS` | — | URLs extra (previews) | No |
| `PORT` | — | (Render lo inyecta) | Auto |
| `APP_HOST` | `localhost` | — | Local |
| `FRONTEND_PORT` | `4000` | — | Local |
| `BACKEND_PORT` | `3000` | — | Local |

### Frontend (Vercel / local)

| Variable | Desarrollo local | Producción (Vercel) |
|----------|------------------|---------------------|
| `NEXT_PUBLIC_API_URL` | Auto desde `config/.env` | `https://cofradenet-api.onrender.com` |

Definir en el **dashboard de Vercel** → Settings → Environment Variables.

---

## Scripts útiles

```bash
# Raíz del monorepo
npm run db:up          # PostgreSQL local (Podman)
npm run db:down        # Parar PostgreSQL
npm run db:seed        # Seed en BD configurada en config/.env
npm run dev:backend    # NestJS en modo watch
npm run dev:frontend   # Next.js en modo desarrollo

# Backend
cd backend
npm run build          # Compilar
npm run start:prod     # Producción
npm run seed           # Seed manual
```

---

## Solución de problemas

### La API tarda mucho en responder (Render Free)

El plan gratuito **duerme** el servicio tras ~15 min sin tráfico. La primera petición lo despierta (~30 s). Es normal.

### Error de conexión a Supabase

- Usa la URI del **pooler** (puerto `6543`, modo Transaction).
- Comprueba que la contraseña en la URL no tenga caracteres sin escapar (`@`, `#`, etc. → codifícalos en URL).
- En Supabase → **Settings → Database**, verifica que el proyecto no esté pausado.

### CORS bloqueado en el navegador

- `FRONTEND_URL` en Render debe coincidir **exactamente** con la URL de Vercel (con `https://`, sin barra final).
- Los **preview deployments** de Vercel tienen URL distinta; añádelas en `CORS_ORIGINS`.

### `/search` devuelve 500

Ejecuta en Supabase SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### Las imágenes no cargan

- Comprueba `MEDIA_STORAGE_PROVIDER=r2` y las cuatro variables `R2_*` en Render.
- Verifica que el token R2 tenga permisos **Object Read & Write** sobre el bucket correcto.
- En el navegador, la URL de imagen debe ser `https://tu-api.onrender.com/archivos/{uuid}`.

### El seed falla en Render Shell

- Confirma que `DATABASE_URL` está definida y el servicio ha arrancado al menos una vez (tablas creadas).
- Ejecuta `npm run seed` desde el directorio `backend` (rootDir del servicio).

### Frontend no encuentra la API (Vercel)

- `NEXT_PUBLIC_API_URL` debe estar en **Vercel → Environment Variables** antes del build.
- Tras cambiarla, ve a **Deployments → Redeploy**.
- Comprueba en el navegador que las peticiones van a `https://tu-api.onrender.com`, no a `localhost`.

### Build de Vercel falla por variables de entorno

- En Vercel solo necesitas `NEXT_PUBLIC_API_URL` para producción.
- `config/.env` **no** se sube al repo; Vercel no lo usa.
- `next.config.ts` ya está preparado para leer `NEXT_PUBLIC_API_URL` directamente.

---

## Estructura del proyecto

```
app-cofradenet/
├── backend/              # API NestJS → Render
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── frontend/             # Next.js → Vercel
│   ├── vercel.json
│   └── package.json
├── config/
│   ├── .env.example      # Plantilla de variables
│   ├── .env              # Local (no commitear)
│   ├── postgres/init.sql # Extensión unaccent (local)
│   └── supabase/init.sql # Extensión unaccent (nube)
├── compose.yaml          # PostgreSQL local (Podman)
├── render.yaml           # Blueprint Render
└── package.json          # Scripts del monorepo
```

---

## Resumen del orden de despliegue

1. **GitHub** — subir el código
2. **Supabase** — crear proyecto, `unaccent`, copiar `DATABASE_URL`
3. **Cloudflare R2** — crear bucket y API token
4. **Render** — desplegar backend, configurar env vars, seed
5. **Vercel** — importar `frontend/`, configurar `NEXT_PUBLIC_API_URL`
6. **Render** — actualizar `FRONTEND_URL` con la URL de Vercel
7. **Verificar** — health, login, búsqueda, subida de imágenes

---

## Licencia

Proyecto privado — CofradeNet.
