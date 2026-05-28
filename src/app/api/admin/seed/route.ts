import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { SEED_MATCHES } from '@/lib/matches-data';

export async function POST() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const rows = SEED_MATCHES.map((m) => ({
    id: m.id,
    stage: m.stage,
    group_letter: m.group_letter,
    matchday: m.matchday,
    kickoff_utc: m.kickoff_utc,
    venue: m.venue,
    city: m.city,
    country: m.country,
    home_team: m.home,
    away_team: m.away
  }));

  const { error, count } = await admin
    .from('matches')
    .upsert(rows, { onConflict: 'id', count: 'exact' });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, inserted: count ?? rows.length });
}
