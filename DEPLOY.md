# Guía de deploy paso a paso

> ⏰ **Tiempo estimado total: ~45 minutos.** El Mundial empieza el 11 de junio de 2026, así que tienes margen pero no demasiado. Hazlo en una sola sesión.

Vas a usar **tres servicios gratuitos**:

| Servicio | Para qué | Costo |
|---|---|---|
| **Supabase** | Base de datos (los picks de tus amigos) + login | Gratis hasta 50,000 usuarios |
| **Vercel** | Hosting de la app | Gratis para uso personal |
| **football-data.org** | Resultados automáticos de los partidos | Gratis (10 req/min) |

---

## 1. Sube el código a GitHub

Si todavía no tienes cuenta:

1. Crea cuenta en https://github.com/signup (gratis).
2. Instala [GitHub Desktop](https://desktop.github.com) — es el modo más fácil sin terminal.
3. Crea un repositorio nuevo llamado `quiniela-mundial-2026` (puedes marcarlo como **Privado**).
4. Arrastra esta carpeta dentro de GitHub Desktop, escribe un mensaje de commit ("setup inicial") y haz click en **Publish repository**.

> *Atajo si usas terminal:* `cd quiniela-mundial-2026 && git init && git add . && git commit -m "init" && gh repo create --private --source=. --push`.

---

## 2. Crea el proyecto en Supabase (base de datos + login)

1. Ve a https://supabase.com → **Start your project** → entra con GitHub.
2. **New project**:
   - Name: `quiniela-mundial-2026`
   - Database password: invéntala (la usarás solo si quieres conectarte con un cliente SQL). Guárdala en tu manager de contraseñas.
   - Region: **South America (São Paulo)** o **East US (N. Virginia)** — la más cercana a tus amigos.
   - Plan: **Free**.
3. Espera ~2 min a que termine de crearlo.

### 2.1 Carga el schema

1. Menú izquierdo → **SQL Editor** → **New query**.
2. Abre el archivo `supabase/schema.sql` de este repo, copia **TODO**, pégalo en el editor.
3. Click en **Run** (esquina inferior derecha). Verás "Success. No rows returned".
4. **New query** otra vez → pega `supabase/migration-01-player-picks.sql` → Run. (Esta migración habilita la vista del jugador y la gráfica de histórico).
5. **New query** una vez más → pega `supabase/migration-02-special-picks.sql` → Run. (Esta migración habilita los premios individuales: goleador, asistidor, portero, jugador del torneo).

### 2.2 Configura el login con Google (opcional pero recomendado)

> Si saltas este paso, tus amigos podrán entrar con email + contraseña. Si lo haces, también podrán entrar con un click de Google.

1. En Supabase: menú izquierdo → **Authentication** → **Providers** → **Google** → toggle **Enable**.
2. Verás que pide `Client ID` y `Client Secret`. Para obtenerlos:
   1. Abre https://console.cloud.google.com/ y crea un proyecto nuevo (si no tienes ninguno).
   2. Menú izquierdo → **APIs & Services** → **OAuth consent screen** → User Type: **External** → continúa con los defaults. Agrega tu email en "Test users" para que puedas probar antes de publicar.
   3. Menú izquierdo → **Credentials** → **Create Credentials** → **OAuth client ID** → Web application.
   4. **Authorized JavaScript origins**:
      - `https://[tu-id-de-supabase].supabase.co` (lo ves arriba del todo en Supabase, ej. `abcxxxxxxx.supabase.co`)
   5. **Authorized redirect URIs**:
      - `https://[tu-id-de-supabase].supabase.co/auth/v1/callback`
   6. Click **Create** → copia el **Client ID** y **Client Secret**.
   7. Pégalos en Supabase y guarda.
3. (Después del deploy en Vercel, vuelve a Google Cloud y agrega también `https://[tu-proyecto].vercel.app` a "Authorized JavaScript origins" y `https://[tu-proyecto].vercel.app/auth/callback` a "Authorized redirect URIs").

### 2.3 Configura las URLs de redirect

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL**: por ahora pon `http://localhost:3000` (lo cambiarás cuando tengas Vercel).
3. **Redirect URLs**: agrega
   - `http://localhost:3000/auth/callback`
   - (luego agregarás `https://[tu-proyecto].vercel.app/auth/callback`)

### 2.4 Copia las llaves que vas a necesitar

1. Supabase → **Settings** (engranaje) → **API**.
2. Copia y guarda temporalmente (los pegarás en Vercel):
   - `Project URL` → será `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → será `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → será `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **NUNCA** pongas la `service_role` key en código del cliente o en GitHub público.

---

## 3. Saca tu API key de football-data.org

1. Ve a https://www.football-data.org/client/register → llena el form (1 minuto).
2. Te llega un email con tu API key. Guárdala.
3. La Free tier incluye el Mundial. 10 requests/minuto es más que suficiente para nosotros.

---

## 4. Deploy a Vercel

1. Ve a https://vercel.com/signup → entra con GitHub.
2. **Add New** → **Project** → busca tu repo `quiniela-mundial-2026` → **Import**.
3. **Framework Preset**: Next.js (debería auto-detectarlo).
4. Abre **Environment Variables** y agrega cada una:

   | Variable | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL de Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key de Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key de Supabase |
   | `FOOTBALL_DATA_API_KEY` | la API key del paso 3 |
   | `CRON_SECRET` | inventa una cadena larga aleatoria (ej. usa `openssl rand -hex 32`) |
   | `ADMIN_EMAIL` | el email con el que vas a loguearte tú |
   | `NEXT_PUBLIC_ADMIN_EMAIL` | mismo email (para mostrar la pestaña Admin en el navbar) |
   | `NEXT_PUBLIC_POOL_NAME` | "Quiniela de [tu grupo]" (opcional) |

5. Click **Deploy**. Espera ~2 minutos.

6. Cuando termine, te da una URL tipo `quiniela-mundial-2026-xxxx.vercel.app`. ¡Es tu app!

### 4.1 Termina la configuración de Supabase con la URL de Vercel

1. Supabase → **Authentication** → **URL Configuration**:
   - **Site URL**: cambia a `https://quiniela-mundial-2026-xxxx.vercel.app`.
   - **Redirect URLs**: agrega `https://quiniela-mundial-2026-xxxx.vercel.app/auth/callback`.
2. Si configuraste Google login, vuelve a Google Cloud → Credentials → tu OAuth client → agrega también ese dominio en JavaScript origins y redirect URIs.

---

## 5. Carga los 72 partidos

1. Entra a tu app en `https://quiniela-mundial-2026-xxxx.vercel.app/login`.
2. Crea tu cuenta (usa el email que pusiste en `ADMIN_EMAIL`).
3. Confirma tu email (Supabase manda un correo).
4. Vuelve a la app, ya logueado, verás la pestaña **Admin**.
5. Click en **"1. Cargar 72 partidos de grupos"**. Deberías ver "✓ 72 partidos cargados".
6. Click en **"🔄 Traer resultados (football-data.org)"** para verificar que la API funciona (devolverá 0 actualizados porque todavía no hay partidos jugados).

---

## 6. Invita a tus amigos

1. Mándales tu URL de Vercel.
2. Cada uno se crea cuenta (Google o email).
3. **Importante**: comparten su nombre real (lo ven todos en el ranking).
4. Tienen hasta las **12 h antes del primer kickoff del 11 de junio** para llenar todos los marcadores de la fase de grupos.

> **Cierre real:** 11 de junio 2026, 06:00 UTC = **11 de junio 12:00 AM CDMX**. (12 h antes del Méx vs Sudáfrica a las 12:00 PM CDMX en el Azteca).

---

## 7. Durante el torneo

- El cron de Vercel ejecuta `/api/results/refresh` **cada 5 minutos**. Trae los resultados automáticamente de football-data.org y recalcula el ranking solo.
- Si la API falla o un resultado se ve mal, entra al **Admin** y captúralo a mano.
- Para los partidos de eliminatoria que tus amigos predicen como empate, el formulario les pedirá automáticamente "¿quién avanza por penales?".

### Cargar las rondas de eliminatoria

El bracket de eliminatorias se conocerá hasta el 27 de junio (último día de grupos). Después de eso:

1. Entra al Admin.
2. (Pendiente: agregar UI para crear nuevos matches knockout, o ejecuta inserts en Supabase SQL editor con `stage = 'r32'`, `'r16'`, `'qf'`, `'sf'`, `'tp'`, `'final'`).

Para 2026 el bracket es **dieciseisavos (r32) → octavos (r16) → cuartos (qf) → semis (sf) → 3er lugar (tp) → final**.

---

## Troubleshooting

**"Cannot find module @supabase/ssr" al hacer build**
Confirma que `package.json` tiene la dependencia y haz `npm install` antes de pushear.

**El cron de Vercel no se ejecuta**
- Vercel free tier permite crons solo en proyectos no-comerciales (está OK para nosotros).
- Revisa Vercel → tu proyecto → **Cron Jobs**. Debe estar listado `/api/results/refresh`.
- Vercel pasa un header `Authorization: Bearer $CRON_SECRET` solo si configuras la variable en el entorno **Production**.

**Mis amigos no aparecen en el ranking**
- Confirma que confirmaron su email (Supabase → Authentication → Users).
- Cada amigo debe haber hecho al menos 1 pick para que su display_name aparezca como `null total_points`.

**Los nombres en la API y la app no coinciden**
- Edita `src/app/api/results/refresh/route.ts` → `TEAM_ALIASES` → agrega el alias que football-data.org está usando.

---

## Hardening (opcional, recomendado antes del 11 de junio)

- En Supabase → **Authentication** → **Email** → desactiva "Enable email signups" después de que todos tus amigos creen cuenta (para evitar randoms).
- O usa la opción "Email confirmations required" para que cada cuenta nueva pase por tu email.
- Cambia tu `CRON_SECRET` si crees que pudo filtrarse.

---

## Soporte

Si algo se rompe, revisa los logs en Vercel → tu proyecto → **Logs**. La mayoría de los errores son por una variable de entorno mal puesta. Vuelve a checar los valores en Settings → Environment Variables, redeploy.
