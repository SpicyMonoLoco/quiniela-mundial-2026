import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PicksClient } from './PicksClient';
import { projectAllMatches } from '@/lib/projections';
import type { Match, Pick, PoolConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PicksPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: matches }, { data: picks }, { data: config }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.from('picks').select('*').eq('user_id', user.id),
    supabase.from('pool_config').select('*').eq('id', 1).single()
  ]);

  // Proyectar los placeholders del knockout con los standings actuales
  const projected = projectAllMatches((matches as Match[]) ?? []);

  return (
    <PicksClient
      matches={projected}
      initialPicks={(picks as Pick[]) ?? []}
      config={config as PoolConfig}
    />
  );
}
