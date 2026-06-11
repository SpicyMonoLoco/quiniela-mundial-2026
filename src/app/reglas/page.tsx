import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { PoolConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';

function formatCR(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const dayName = d.toLocaleString('es-MX', { weekday: 'long', timeZone: 'UTC' });
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'long', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${dayName} ${day} de ${month} · ${time} hora Costa Rica`;
}

export default async function ReglasPage() {
  const supabase = createClient();
  const { data: config } = await supabase
    .from('pool_config')
    .select('*')
    .eq('id', 1)
    .single();
  const cfg = config as PoolConfig | null;

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <header className="card p-5">
        <h1 className="text-2xl font-bold mb-1">📋 Reglas de la quiniela</h1>
        <p className="text-gray-400 text-sm">
          {cfg?.pool_name ?? 'Quiniela PDP — Mundial 2026'}
        </p>
      </header>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>🎯</span> Cómo se ganan puntos
        </h2>
        <p className="text-sm text-gray-300">
          En cada partido predices el marcador final. Los puntos se reparten así:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-3">
            <span className="badge bg-gold text-ink font-bold shrink-0 mt-0.5">
              {cfg?.pts_exact ?? 5} pts
            </span>
            <span>
              <strong>Marcador exacto.</strong> Si dijiste 2-1 y quedó 2-1.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge bg-win text-ink font-bold shrink-0 mt-0.5">
              {cfg?.pts_result ?? 3} pts
            </span>
            <span>
              <strong>Resultado correcto.</strong> Si dijiste 2-1 y quedó 3-0 (igual ganó local). También aplica para empates.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge bg-line text-gray-400 font-bold shrink-0 mt-0.5">
              0 pts
            </span>
            <span>
              <strong>Resultado equivocado.</strong> Si dijiste que ganaba local y ganó visitante (o viceversa).
            </span>
          </li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>⏰</span> Cuándo se cierran los picks
        </h2>
        <p className="text-sm text-gray-300">
          Una vez cerrados, <strong>no se pueden editar</strong>. Si no llenaste un pick, ese partido cuenta como 0 pts.
        </p>
        <div className="space-y-2 text-sm">
          <div className="p-3 bg-ink rounded-lg border border-line">
            <p className="font-semibold text-accent mb-1">Fase de grupos</p>
            <p className="text-gray-300">
              Todos los picks de los 72 partidos cierran al mismo tiempo:{' '}
              <strong>{cfg ? formatCR(cfg.group_lock_utc) : '—'}</strong>
              {' '}(30 min antes del opener México vs Sudáfrica).
            </p>
          </div>
          <div className="p-3 bg-ink rounded-lg border border-line">
            <p className="font-semibold text-accent mb-1">Eliminatorias</p>
            <p className="text-gray-300">
              Los picks de cada ronda (Dieciseisavos, Octavos, Cuartos, Semis, 3er lugar, Final)
              cierran <strong>2 horas antes del primer partido de esa ronda</strong>.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>⚽</span> Empates en eliminatorias
        </h2>
        <p className="text-sm text-gray-300">
          En las rondas eliminatorias no hay empate al final del partido — alguien tiene que avanzar.
          Si tu pick es un empate (ej. 1-1), la app te va a pedir{' '}
          <strong className="text-accent">elegir qué equipo avanza por penales</strong>.
        </p>
        <p className="text-xs text-gray-400">
          Si aciertas el marcador exacto y el equipo que avanza → {cfg?.pts_exact ?? 5} pts. Si aciertas el marcador
          pero te equivocas en quién avanza → solo {cfg?.pts_result ?? 3} pts. Si fallas el marcador y dijiste
          empate cuando no hubo → 0 pts.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>🏆</span> Premios individuales
        </h2>
        <p className="text-sm text-gray-300">
          Además de los partidos, hay 4 premios individuales que valen{' '}
          <strong className="text-gold">{cfg?.pts_award ?? 10} pts cada uno</strong> si aciertas. Total: hasta{' '}
          <strong className="text-gold">{(cfg?.pts_award ?? 10) * 4} pts extra</strong>.
        </p>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>👟 Bota de Oro</strong> — máximo goleador del torneo. Cierra con la fase de grupos.
          </li>
          <li>
            <strong>🎯 Máximo asistidor</strong> — el que más asistencias dé. Cierra con la fase de grupos.
          </li>
          <li>
            <strong>🧤 Guante de Oro</strong> — mejor portero del torneo. Cierra 2h antes de la primera semi.
          </li>
          <li>
            <strong>🏆 Balón de Oro</strong> — mejor jugador del torneo (MVP). Cierra 2h antes de la primera semi.
          </li>
        </ul>
        <p className="text-xs text-gray-400">
          Los llenas en la pestaña <strong>Mis picks → 🏆 Premios</strong>. Escribe el nombre exacto del jugador. La comparación ignora mayúsculas y espacios extra al final del torneo.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>🏅</span> Cómo se desempata el ranking
        </h2>
        <ol className="space-y-1 text-sm list-decimal list-inside text-gray-300">
          <li>El que tenga más <strong className="text-accent">puntos totales</strong>.</li>
          <li>Si empatan, gana el que tenga más <strong className="text-gold">marcadores exactos</strong>.</li>
          <li>Si siguen empatados, se resuelve con <strong className="text-win">un partido de FIFA</strong> entre los empatados. 🎮</li>
        </ol>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <span>📊</span> Resumen de puntaje máximo posible
        </h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            <tr>
              <td className="py-2 text-gray-300">72 partidos de grupos × 5 pts</td>
              <td className="py-2 text-right font-bold">360 pts</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-300">32 partidos de eliminatoria × 5 pts</td>
              <td className="py-2 text-right font-bold">160 pts</td>
            </tr>
            <tr>
              <td className="py-2 text-gray-300">4 premios individuales × {cfg?.pts_award ?? 10} pts</td>
              <td className="py-2 text-right font-bold">{(cfg?.pts_award ?? 10) * 4} pts</td>
            </tr>
            <tr className="border-t-2 border-accent">
              <td className="py-2 font-bold">Máximo teórico</td>
              <td className="py-2 text-right font-bold text-accent">
                {360 + 160 + (cfg?.pts_award ?? 10) * 4} pts
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="text-center py-2">
        <Link href="/picks" className="btn-primary text-sm">
          Ir a mis picks →
        </Link>
      </div>

      <footer className="text-xs text-gray-500 text-center py-4">
        Hecho con cariño para la banda PDP 💛
      </footer>
    </div>
  );
}
