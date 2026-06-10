import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_AWARDS = ['top_scorer', 'top_assists', 'best_keeper', 'best_player'] as const;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  if (!body || !Array.isArray(body.picks)) {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }

  // Verificar locks por award (no podemos confiar en el cliente)
  const { data: cfg } = await supabase.from('pool_config').select('*').eq('id', 1).single();
  if (!cfg) return NextResponse.json({ ok: false, error: 'no config' }, { status: 500 });

  const now = Date.now();
  const groupLocked = now >= new Date(cfg.group_lock_utc).getTime();
  const semiLocked = cfg.semi_lock_utc && now >= new Date(cfg.semi_lock_utc).getTime();

  function isLocked(award: string): boolean {
    if (award === 'top_scorer' || award === 'top_assists') return groupLocked;
    if (award === 'best_keeper' || award === 'best_player') return Boolean(semiLocked);
    return true;
  }

  const rows: { user_id: string; award: string; player_name: string; updated_at: string }[] = [];
  for (const p of body.picks) {
    if (!p || typeof p.award !== 'string' || typeof p.player_name !== 'string') continue;
    if (!VALID_AWARDS.includes(p.award)) continue;
    if (isLocked(p.award)) continue;
    const name = p.player_name.trim();
    if (!name) continue;
    rows.push({
      user_id: user.id,
      award: p.award,
      player_name: name,
      updated_at: new Date().toISOString()
    });
  }

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, saved: 0 });
  }

  const { error } = await supabase.from('special_picks').upsert(rows, { onConflict: 'user_id,award' });
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, saved: rows.length });
}
