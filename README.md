# 🏆 Quiniela Mundial 2026

App web para hacer una quiniela del Mundial 2026 con tus amigos.

- **5 pts** marcador exacto · **3 pts** resultado correcto · **0 pts** fallaste
- Picks de fase de grupos cierran **1 h antes del primer kickoff** (Jun 11, 2026 · 12:00 PM CR)
- Picks de eliminatorias cierran **2 h antes del primer match de la ronda**
- En empates de eliminatoria predices **quién avanza por penales**
- Desempate del ranking: número de marcadores exactos, luego nombre
- Resultados se actualizan automáticamente desde football-data.org

Stack: Next.js 14 + Supabase (Postgres + Auth) + Tailwind + Vercel.

## Pasos rápidos

1. Crea cuentas: [Supabase](https://supabase.com) y [Vercel](https://vercel.com) y [football-data.org](https://www.football-data.org/client/register) (las tres gratis).
2. Pega `supabase/schema.sql` en Supabase → SQL Editor → Run.
3. Conecta este repo a Vercel y mete las variables de entorno (mira `.env.local.example`).
4. Una vez deployada, entra como admin y haz click en "Cargar 72 partidos de grupos".
5. Comparte el link de Vercel con tus amigos.

Guía completa paso a paso → [DEPLOY.md](./DEPLOY.md).

## Probar localmente

```bash
npm install
cp .env.local.example .env.local   # rellena los valores
npm run dev
```

Abre http://localhost:3000.
