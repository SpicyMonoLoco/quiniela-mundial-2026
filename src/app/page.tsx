import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { LeaderRow, PoolConfig, Match } from '@/lib/types';
import { flagFor } from '@/lib/flags';
import { FunFact } from '@/components/FunFact';

export const dynamic = 'force-dynamic';

function formatCDMX(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${day} ${month} · ${time} CDMX`;
}

export default async function Home() {
  const supabase = createClient();

  const [{ data: leaders }, { data: config }, { data: nextMatches }] = await Promise.all([
    supabase.rpc('get_leaderboard'),
    supabase.from('pool_config').select('*').eq('id', 1).single(),
    supabase
      .from('matches')
      .select('*')
      .eq('status', 'SCHEDULED')
      .order('kickoff_utc', { ascending: true })
      .limit(5)
  ]);

  const cfg = config as PoolConfig | null;
  const lockTime = cfg ? new Date(cfg.group_lock_utc) : null;
  const now = new Date();
  const groupLocked = lockTime ? now >= lockTime : false;

  return (
    <div className="space-y-8">
      {/* Hero / estado de la quiniela */}
      <section className="card p-5 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-gold/20 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center h-10 px-3 rounded-md bg-gradient-to-br from-accent to-gold text-ink font-extrabold tracking-widest shadow">
            PDP
          </span>
          <h1 className="text-2xl font-bold">{cfg?.pool_name ?? 'Quiniela PDP — Mundial 2026'}</h1>
        </div>
        <p className="text-gray-400 text-sm">
          Marcador exacto: <span className="text-gold font-semibold">{cfg?.pts_exact ?? 5} pts</span> · Resultado
          correcto: <span className="text-win font-semibold">{cfg?.pts_result ?? 3} pts</span> · Mal: 0 pts
        </p>
        {lockTime && (
          <p className="mt-3 text-sm">
            {groupLocked ? (
              <span className="text-lose">🔒 Picks de grupos cerrados</span>
            ) : (
              <>
                ⏰ <span className="text-gray-300">Cierre fase de grupos:</span>{' '}
                <span className="text-accent font-medium">{formatCDMX(cfg!.group_lock_utc)}</span>
              </>
            )}
          </p>
        )}
        <div className="flex gap-2 mt-4">
          <Link href="/picks" className="btn-primary text-sm">
            Hacer mis picks →
          </Link>
        </div>
      </section>

      {/* Dato curioso del Mundial */}
      <FunFact />

      {/* Ranking */}
      <section className="card p-5">
        <h2 className="font-semibold mb-3">🏅 Ranking</h2>
        {leaders && leaders.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-left text-xs uppercase">
                <th className="py-2 w-8">#</th>
                <th>Jugador</th>
                <th className="text-right">Aciertos exactos</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(leaders as LeaderRow[]).map((r) => (
                <tr key={r.user_id} className="border-t border-line hover:bg-line/40 transition">
                  <td className="py-2 font-bold text-gold">{r.rank}</td>
                  <td className="py-2">
                    <Link href={`/jugador/${r.user_id}`} className="hover:text-accent">
                      {r.display_name}
                    </Link>
                  </td>
                  <td className="py-2 text-right text-gray-300">{r.exact_count}</td>
                  <td className="py-2 text-right font-bold text-accent">{r.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-sm">Aún no hay jugadores. ¡Invita a tus amigos!</p>
        )}
      </section>

      {/* Próximos partidos */}
      <section className="card p-5">
        <h2 className="font-semibold mb-3">⚽ Próximos partidos</h2>
        <div className="space-y-2">
          {(nextMatches as Match[] | null)?.map((m) => (
            <div key={m.id} className="flex items-center justify-between border-t border-line first:border-t-0 pt-2 first:pt-0">
              <div className="text-sm">
                <span className="badge bg-line text-gray-300 mr-2">Grupo {m.group_letter}</span>
                <span className="font-medium">
                  <span className="mr-1">{flagFor(m.home_team)}</span>
                  {m.home_team}
                </span>
                <span className="text-gray-500 mx-1.5">vs</span>
                <span className="font-medium">
                  <span className="mr-1">{flagFor(m.away_team)}</span>
                  {m.away_team}
                </span>
              </div>
              <div className="text-xs text-gray-400">{formatCDMX(m.kickoff_utc)}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-xs text-gray-500 text-center py-4 space-y-1">
        <p>Empates en knockout: predices quién avanza por penales · Desempate: # de marcadores exactos</p>
        <p className="text-gray-600">Hecho con cariño para la banda PDP 💛</p>
      </footer>
    </div>
  );
}
