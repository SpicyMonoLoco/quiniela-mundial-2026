'use client';

import { useMemo, useState } from 'react';
import type { HistoryRow } from './page';

// Paleta cíclica de hasta 14 colores razonablemente distinguibles en fondo oscuro
const PALETTE = [
  '#22d3ee', '#fbbf24', '#34d399', '#f87171', '#a78bfa',
  '#fb923c', '#60a5fa', '#f472b6', '#4ade80', '#facc15',
  '#38bdf8', '#fb7185', '#c084fc', '#2dd4bf'
];

type Series = {
  userId: string;
  name: string;
  color: string;
  points: { x: number; y: number }[]; // x = match_index, y = cum_points
  finalPoints: number;
};

export function HistoricoClient({ rows, selfId }: { rows: HistoryRow[]; selfId: string }) {
  // Construir series por usuario
  const series = useMemo<Series[]>(() => {
    if (rows.length === 0) return [];

    // Agrupar por usuario
    const byUser = new Map<string, { name: string; points: { x: number; y: number }[] }>();
    for (const r of rows) {
      if (!byUser.has(r.user_id)) byUser.set(r.user_id, { name: r.display_name, points: [{ x: 0, y: 0 }] });
      byUser.get(r.user_id)!.points.push({ x: r.match_index, y: r.cum_points });
    }

    // Convertir a array, ordenado por puntos finales descendente
    const arr: Series[] = Array.from(byUser.entries()).map(([userId, v], i) => ({
      userId,
      name: v.name,
      color: PALETTE[i % PALETTE.length],
      points: v.points,
      finalPoints: v.points[v.points.length - 1]?.y ?? 0
    }));

    arr.sort((a, b) => b.finalPoints - a.finalPoints);
    // Reasignar colores en orden de ranking (top jugadores con colores más vivos)
    arr.forEach((s, i) => (s.color = PALETTE[i % PALETTE.length]));
    return arr;
  }, [rows]);

  // Por default: top 8 + self visibles
  const [visible, setVisible] = useState<Set<string>>(() => {
    const set = new Set<string>();
    series.slice(0, 8).forEach((s) => set.add(s.userId));
    if (selfId) set.add(selfId);
    return set;
  });

  function toggle(userId: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function only(userId: string) {
    setVisible(new Set([userId]));
  }

  function showAll() {
    setVisible(new Set(series.map((s) => s.userId)));
  }

  if (series.length === 0) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-bold mb-2">📈 Histórico</h1>
        <p className="text-gray-400 text-sm">
          Cuando los primeros partidos terminen, aquí verás cómo va subiendo el ranking partido a partido.
        </p>
      </div>
    );
  }

  // Dimensiones del chart
  const maxX = Math.max(...series.flatMap((s) => s.points.map((p) => p.x)));
  const maxY = Math.max(5, ...series.flatMap((s) => s.points.map((p) => p.y)));

  const W = 720;
  const H = 360;
  const PAD = { top: 20, right: 20, bottom: 36, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const xScale = (x: number) => PAD.left + (x / Math.max(maxX, 1)) * innerW;
  const yScale = (y: number) => PAD.top + innerH - (y / maxY) * innerH;

  // Ticks
  const xStep = maxX <= 24 ? 4 : maxX <= 48 ? 8 : 12;
  const xTicks: number[] = [];
  for (let i = 0; i <= maxX; i += xStep) xTicks.push(i);
  if (xTicks[xTicks.length - 1] !== maxX) xTicks.push(maxX);

  const yStep = maxY <= 20 ? 5 : maxY <= 50 ? 10 : 20;
  const yTicks: number[] = [];
  for (let i = 0; i <= maxY; i += yStep) yTicks.push(i);

  return (
    <div className="space-y-4">
      <header className="card p-5">
        <h1 className="text-xl font-bold mb-1">📈 Histórico de puntos</h1>
        <p className="text-gray-400 text-sm">
          Puntos acumulados de cada jugador después de cada partido finalizado.
        </p>
      </header>

      {/* Chart */}
      <div className="card p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ minWidth: 480 }}
          aria-label="Gráfica de puntos acumulados"
        >
          {/* Y grid + ticks */}
          {yTicks.map((t) => (
            <g key={`y-${t}`}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yScale(t)}
                y2={yScale(t)}
                stroke="#1f2937"
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={yScale(t) + 3} fontSize={10} fill="#6b7280" textAnchor="end">
                {t}
              </text>
            </g>
          ))}

          {/* X ticks */}
          {xTicks.map((t) => (
            <g key={`x-${t}`}>
              <line
                x1={xScale(t)}
                x2={xScale(t)}
                y1={H - PAD.bottom}
                y2={H - PAD.bottom + 3}
                stroke="#374151"
                strokeWidth={1}
              />
              <text
                x={xScale(t)}
                y={H - PAD.bottom + 16}
                fontSize={10}
                fill="#6b7280"
                textAnchor="middle"
              >
                {t}
              </text>
            </g>
          ))}

          {/* Eje X label */}
          <text
            x={PAD.left + innerW / 2}
            y={H - 4}
            fontSize={11}
            fill="#9ca3af"
            textAnchor="middle"
          >
            Partido #
          </text>

          {/* Líneas */}
          {series.map((s) => {
            if (!visible.has(s.userId)) return null;
            const isSelf = s.userId === selfId;
            const d = s.points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`)
              .join(' ');
            return (
              <g key={s.userId}>
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={isSelf ? 2.5 : 1.5}
                  strokeOpacity={isSelf ? 1 : 0.85}
                />
                {/* Punto final con etiqueta */}
                {s.points.length > 1 && (
                  <>
                    <circle
                      cx={xScale(s.points[s.points.length - 1].x)}
                      cy={yScale(s.points[s.points.length - 1].y)}
                      r={isSelf ? 4 : 3}
                      fill={s.color}
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Leyenda + controles */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">Jugadores</h2>
          <div className="flex gap-2 text-xs">
            <button onClick={showAll} className="text-accent hover:underline">
              Ver todos
            </button>
            <button
              onClick={() => setVisible(new Set([selfId]))}
              className="text-accent hover:underline"
            >
              Solo yo
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {series.map((s) => {
            const on = visible.has(s.userId);
            const isSelf = s.userId === selfId;
            return (
              <button
                key={s.userId}
                onClick={() => toggle(s.userId)}
                onDoubleClick={() => only(s.userId)}
                className={`flex items-center gap-2 text-xs py-1.5 px-2 rounded-md border transition ${
                  on
                    ? 'border-line bg-line/40'
                    : 'border-transparent bg-transparent opacity-40 hover:opacity-70'
                }`}
                title="Click: toggle · doble click: solo este"
              >
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ background: s.color, opacity: on ? 1 : 0.3 }}
                />
                <span className={`truncate flex-1 text-left ${isSelf ? 'font-semibold' : ''}`}>
                  {s.name} {isSelf && '(tú)'}
                </span>
                <span className="text-accent font-bold tabular-nums">{s.finalPoints}</span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center pb-2">
        Click en un nombre para esconderlo · doble click para aislarlo
      </p>
    </div>
  );
}
