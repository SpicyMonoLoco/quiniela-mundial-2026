import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Actualiza metadatos del partido (no resultados):
 *   - home_team, away_team (para reemplazar placeholders knockout por equipos reales)
 *   - kickoff_utc (si FIFA mueve la hora)
 *   - venue, city, country (raramente, pero por si acaso)
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const matchId = Number(params.id);
  if (Number.isNaN(matchId)) {
    return NextResponse.json({ ok: false, error: 'bad match id' }, { status: 400 });
  }

  // Solo permitimos las llaves esperadas
  const update: Record<string, unknown> = {};
  if (typeof body.home_team === 'string' && body.home_team.trim()) update.home_team = body.home_team.trim();
  if (typeof body.away_team === 'string' && body.away_team.trim()) update.away_team = body.away_team.trim();
  if (typeof body.kickoff_utc === 'string') update.kickoff_utc = body.kickoff_utc;
  if (typeof body.venue === 'string') update.venue = body.venue;
  if (typeof body.city === 'string') update.city = body.city;
  if (typeof body.country === 'string') update.country = body.country;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: 'nothing to update' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('matches')
    .update(update)
    .eq('id', matchId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, match: data });
}
