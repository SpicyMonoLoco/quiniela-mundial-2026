import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

// Mapeo de nombres en español ↔ nombres en football-data.org (inglés).
// Si football-data devuelve nombres alternos, agrégalos aquí.
const TEAM_ALIASES: Record<string, string[]> = {
  México: ['Mexico'],
  'Sudáfrica': ['South Africa'],
  'Corea del Sur': ['South Korea', 'Korea Republic'],
  'República Checa': ['Czech Republic', 'Czechia'],
  'Estados Unidos': ['United States', 'USA'],
  Paraguay: ['Paraguay'],
  'Canadá': ['Canada'],
  'Bosnia y Herzegovina': ['Bosnia and Herzegovina', 'Bosnia-Herzegovina'],
  Brasil: ['Brazil'],
  Marruecos: ['Morocco'],
  'Haití': ['Haiti'],
  Escocia: ['Scotland'],
  Qatar: ['Qatar'],
  Suiza: ['Switzerland'],
  Australia: ['Australia'],
  'Türkiye': ['Turkey', 'Türkiye', 'Turkiye'],
  Alemania: ['Germany'],
  Curazao: ['Curaçao', 'Curacao'],
  'Costa de Marfil': ["Côte d'Ivoire", 'Cote dIvoire', 'Ivory Coast'],
  Ecuador: ['Ecuador'],
  Suecia: ['Sweden'],
  'Túnez': ['Tunisia'],
  'Países Bajos': ['Netherlands'],
  'Japón': ['Japan'],
  'Bélgica': ['Belgium'],
  Egipto: ['Egypt'],
  'Irán': ['Iran', 'IR Iran', 'Iran (Islamic Republic of)'],
  'Nueva Zelanda': ['New Zealand'],
  'España': ['Spain'],
  'Cabo Verde': ['Cape Verde'],
  'Arabia Saudí': ['Saudi Arabia'],
  Uruguay: ['Uruguay'],
  Francia: ['France'],
  Senegal: ['Senegal'],
  Irak: ['Iraq'],
  Noruega: ['Norway'],
  Argentina: ['Argentina'],
  Argelia: ['Algeria'],
  Austria: ['Austria'],
  Jordania: ['Jordan'],
  Portugal: ['Portugal'],
  'RD Congo': ['DR Congo', 'Congo DR', 'Democratic Republic of the Congo'],
  Uzbekistán: ['Uzbekistan'],
  Colombia: ['Colombia'],
  Inglaterra: ['England'],
  Croacia: ['Croatia'],
  Ghana: ['Ghana'],
  Panamá: ['Panama']
};

function matchTeam(localName: string, apiName: string): boolean {
  if (localName === apiName) return true;
  const aliases = TEAM_ALIASES[localName] ?? [];
  return aliases.includes(apiName);
}

async function fetchWcMatches() {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error('FOOTBALL_DATA_API_KEY no configurado');

  const url = 'https://api.football-data.org/v4/competitions/WC/matches?season=2026';
  const res = await fetch(url, { headers: { 'X-Auth-Token': key }, cache: 'no-store' });
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${await res.text()}`);
  return res.json();
}

async function authorized(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth && auth === `Bearer ${process.env.CRON_SECRET}`) return true;

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user && user.email?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase()) return true;
  return false;
}

export async function POST(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return doRefresh();
}

// Vercel Cron usa GET por defecto
export async function GET(request: Request) {
  if (!(await authorized(request))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  return doRefresh();
}

async function doRefresh() {
  try {
    const data = await fetchWcMatches();
    const admin = createAdminClient();
    const { data: localMatches } = await admin.from('matches').select('*');
    if (!localMatches) return NextResponse.json({ ok: true, updated: 0 });

    let updated = 0;
    for (const apiMatch of data.matches ?? []) {
      const apiHome = apiMatch.homeTeam?.name ?? apiMatch.homeTeam?.shortName;
      const apiAway = apiMatch.awayTeam?.name ?? apiMatch.awayTeam?.shortName;
      if (!apiHome || !apiAway) continue;

      const local = localMatches.find(
        (m) =>
          matchTeam(m.home_team, apiHome) &&
          matchTeam(m.away_team, apiAway) &&
          m.kickoff_utc.slice(0, 10) === (apiMatch.utcDate ?? '').slice(0, 10)
      );
      if (!local) continue;

      const home = apiMatch.score?.fullTime?.home ?? null;
      const away = apiMatch.score?.fullTime?.away ?? null;
      const status =
        apiMatch.status === 'FINISHED'
          ? 'FINISHED'
          : apiMatch.status === 'IN_PLAY' || apiMatch.status === 'PAUSED' || apiMatch.status === 'LIVE'
          ? 'LIVE'
          : 'SCHEDULED';

      // Solo escribimos si algo cambió
      if (
        local.home_score !== home ||
        local.away_score !== away ||
        local.status !== status ||
        local.external_id !== String(apiMatch.id)
      ) {
        const { error } = await admin
          .from('matches')
          .update({
            home_score: home,
            away_score: away,
            status,
            external_id: String(apiMatch.id),
            updated_at: new Date().toISOString()
          })
          .eq('id', local.id);
        if (!error) updated++;
      }
    }
    return NextResponse.json({ ok: true, updated, totalApiMatches: data.matches?.length ?? 0 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
