import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminClient } from './AdminClient';
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
    return (
      <div className="card p-6">
        <h1 className="font-bold text-lg">Solo admin</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Tu usuario ({user.email}) no es el admin definido en ADMIN_EMAIL.
        </p>
      </div>
    );
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('kickoff_utc', { ascending: true });

  return <AdminClient matches={(matches as Match[]) ?? []} />;
}
