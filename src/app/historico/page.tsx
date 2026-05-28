import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HistoricoClient } from './HistoricoClient';

export const dynamic = 'force-dynamic';

export type HistoryRow = {
  match_id: number;
  kickoff_utc: string;
  user_id: string;
  display_name: string;
  delta_points: number;
  cum_points: number;
  match_index: number;
};

export default async function HistoricoPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase.rpc('get_points_history');

  if (error) {
    return (
      <div className="card p-6">
        <p className="text-lose text-sm">Error cargando histórico: {error.message}</p>
        <p className="text-gray-500 text-xs mt-2">
          ¿Ya corriste la migración <code>supabase/migration-01-player-picks.sql</code> en Supabase?
        </p>
      </div>
    );
  }

  return <HistoricoClient rows={(data as HistoryRow[]) ?? []} selfId={user.id} />;
}
