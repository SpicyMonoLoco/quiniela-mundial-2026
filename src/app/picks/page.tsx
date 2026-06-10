import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PicksClient } from './PicksClient';
import type { Match, Pick, PoolConfig, SpecialPick } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function PicksPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: matches }, { data: picks }, { data: config }, { data: specialPicks }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.from('picks').select('*').eq('user_id', user.id),
    supabase.from('pool_config').select('*').eq('id', 1).single(),
    supabase.from('special_picks').select('*').eq('user_id', user.id)
  ]);

  return (
    <PicksClient
      matches={(matches as Match[]) ?? []}
      initialPicks={(picks as Pick[]) ?? []}
      config={config as PoolConfig}
      initialSpecialPicks={(specialPicks as SpecialPick[]) ?? []}
    />
  );
}
