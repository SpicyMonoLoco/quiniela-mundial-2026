import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GruposClient } from './GruposClient';
import type { Match, Pick as UserPick } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function GruposPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [{ data: matches }, { data: picks }] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .eq('stage', 'group')
      .order('kickoff_utc', { ascending: true }),
    supabase.from('picks').select('*').eq('user_id', user.id)
  ]);

  return (
    <GruposClient
      matches={(matches as Match[]) ?? []}
      picks={(picks as UserPick[]) ?? []}
    />
  );
}
