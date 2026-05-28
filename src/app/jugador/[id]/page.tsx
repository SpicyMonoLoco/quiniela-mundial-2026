import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlayerPicksClient } from './PlayerPicksClient';
import type { Match } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Summary = {
  total_picks: number;
  exact_picks: number;
  result_picks: number;
  graded_matches: number;
  points: number;
  display_name: string;
};

type PlayerPick = {
  match_id: number;
  home_score: number;
  away_score: number;
  advances_team: string | null;
};

export default async function PlayerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: matches }, { data: summaryRows }, { data: visiblePicks }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.rpc('get_player_summary', { p_user_id: params.id }),
    supabase.rpc('get_player_picks', { p_user_id: params.id })
  ]);

  const summary = (summaryRows as Summary[] | null)?.[0] ?? null;

  if (!summary) {
    return (
      <div className="card p-6">
        <p className="text-gray-400">Jugador no encontrado o sin actividad.</p>
        <Link href="/" className="btn-ghost mt-3 inline-flex">
          ← Volver al ranking
        </Link>
      </div>
    );
  }

  const isSelf = user.id === params.id;

  return (
    <PlayerPicksClient
      matches={(matches as Match[]) ?? []}
      visiblePicks={(visiblePicks as PlayerPick[]) ?? []}
      summary={summary}
      isSelf={isSelf}
    />
  );
}
