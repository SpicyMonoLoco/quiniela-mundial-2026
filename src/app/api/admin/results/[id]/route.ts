import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

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

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('matches')
    .update({
      home_score: body.home_score,
      away_score: body.away_score,
      advances_team: body.advances_team ?? null,
      status: body.status ?? 'FINISHED',
      updated_at: new Date().toISOString()
    })
    .eq('id', matchId)
    .select('*')
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, match: data });
}
