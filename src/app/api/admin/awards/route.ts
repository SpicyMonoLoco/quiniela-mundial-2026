import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const VALID_AWARDS = ['top_scorer', 'top_assists', 'best_keeper', 'best_player'] as const;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body || !Array.isArray(body.awards)) {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates: { award: string; player_name: string | null; updated_at: string }[] = [];
  for (const a of body.awards) {
    if (!a || typeof a.award !== 'string') continue;
    if (!VALID_AWARDS.includes(a.award)) continue;
    updates.push({
      award: a.award,
      player_name: typeof a.player_name === 'string' && a.player_name.trim() ? a.player_name.trim() : null,
      updated_at: new Date().toISOString()
    });
  }

  if (updates.length === 0) {
    return NextResponse.json({ ok: true, saved: 0 });
  }

  const { error } = await admin.from('tournament_awards').upsert(updates, { onConflict: 'award' });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: updates.length });
}
