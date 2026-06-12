import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ResultadosClient } from './ResultadosClient';
import type { Match, PoolConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export type MatchPick = {
  match_id: number;
  user_id: string;
  display_name: string;
  home_score: number;
  away_score: number;
  advances_team: string | null;
  points: number;
};

export default async function ResultadosPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: matches }, { data: picks, error: picksError }, { data: config }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.rpc('get_all_match_picks'),
    supabase.from('pool_config').select('*').eq('id', 1).single()
  ]);

  if (picksError) {
    return (
      <div className="card p-6">
        <p className="text-lose text-sm">Error cargando picks: {picksError.message}</p>
        <p className="text-gray-500 text-xs mt-2">
          ¿Ya corriste la migración <code>supabase/migration-05-match-picks-view.sql</code>?
        </p>
      </div>
    );
  }

  return (
    <ResultadosClient
      matches={(matches as Match[]) ?? []}
      allPicks={(picks as MatchPick[]) ?? []}
      config={config as PoolConfig}
      selfId={user.id}
    />
  );
}
