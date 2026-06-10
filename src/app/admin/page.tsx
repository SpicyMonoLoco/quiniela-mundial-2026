import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './AdminClient';
import { NoAdmin } from './NoAdmin';
import type { Match, TournamentAward } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!adminEmail || user.email?.toLowerCase() !== adminEmail) {
    return <NoAdmin />;
  }

  const [{ data: matches }, { data: awards }] = await Promise.all([
    supabase.from('matches').select('*').order('kickoff_utc', { ascending: true }),
    supabase.from('tournament_awards').select('*')
  ]);

  return (
    <AdminClient
      matches={(matches as Match[]) ?? []}
      initialAwards={(awards as TournamentAward[]) ?? []}
    />
  );
}
