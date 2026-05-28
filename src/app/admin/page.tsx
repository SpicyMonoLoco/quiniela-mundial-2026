import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './AdminClient';
import { NoAdmin } from './NoAdmin';
import type { Match } from '@/lib/types';

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

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_utc', { ascending: true });

  return <AdminClient matches={(matches as Match[]) ?? []} />;
}
