'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Match } from '@/lib/types';
import { scorePick } from '@/lib/scoring';
import { flagFor } from '@/lib/flags';

type PlayerPick = {
  match_id: number;
  home_score: number;
  away_score: number;
  advances_team: string | null;
};

type Summary = {
  total_picks: number;
  exact_picks: number;
  graded_matches: number;
  points: number;
  display_name: string;
};

const STAGE_LABELS: Record<Match['stage'], string> = {
  group: 'Fase de grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semis',
  tp: '3er lugar',
  final: 'Final'
};

function formatCR(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${day} ${month} · ${time}`;
}

export function PlayerPicksClient({
  matches,
  visiblePicks,
  summary,
  isSelf
}: {
  matches: Match[];
  visiblePicks: PlayerPick[];
  summary: Summary;
  isSelf: boolean;
}) {
  const picksByMatch = useMemo(() => {
    const m = new Map<number, PlayerPick>();
    for (const p of visiblePicks) m.set(p.match_id, p);
    return m;
  }, [visiblePicks]);

  const stages = useMemo(() => {
    const order: Match['stage'][] = ['group', 'r32', 'r16', 'qf', 'sf', 'tp', 'final'];
    const map = new Map<Match['stage'], Match[]>();
    for (const m of matches) {
      if (!map.has(m.stage)) map.set(m.stage, []);
      map.get(m.stage)!.push(m);
    }
    return order.filter((s) => map.has(s)).map((s) => ({ stage: s, matches: map.get(s)! }));
  }, [matches]);

  const [activeStage, setActiveStage] = useState<Match['stage']>(stages[0]?.stage ?? 'group');
  const activeMatches = stages.find((s) => s.stage === activeStage)?.matches ?? [];

  return (
    <div className="space-y-5">
      {/* Header con el jugador */}
      <header className="card p-5">
        <Link href="/" className="text-xs text-gray-500 hover:text-accent">
          ← Ranking
        </Link>
        <div className="flex items-baseline justify-between mt-2">
          <h1 className="text-2xl font-bold">
            {summary.display_name}
            {isSelf && <span className="ml-2 badge bg-line text-gray-300 text-xs">tú</span>}
          </h1>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent">{summary.points}</p>
            <p className="text-xs text-gray-500 -mt-1">puntos</p>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-sm text-gray-400">
          <span>
            <span className="text-gold font-semibold">{summary.exact_picks}</span> exactos
          </span>
          <span>·</span>
          <span>
            {summary.graded_matches} de {summary.total_picks} picks calificados
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {stages.map((s) => (
          <button
            key={s.stage}
            onClick={() => setActiveStage(s.stage)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap ${
              activeStage === s.stage ? 'bg-accent text-ink font-medium' : 'bg-line text-gray-300'
            }`}
          >
            {STAGE_LABELS[s.stage]}
          </button>
        ))}
      </div>

      {/* Lista de matches */}
      <div className="space-y-2">
        {activeMatches.map((m) => {
          const pick = picksByMatch.get(m.id);
          const finished = m.status === 'FINISHED';
          const points = pick && finished
            ? scorePick(
                { home_score: pick.home_score, away_score: pick.away_score, advances_team: pick.advances_team },
                m,
                { pts_exact: 5, pts_result: 3 }
              )
            : null;

          return (
            <div key={m.id} className="card p-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span>
                  {m.group_letter && <span className="badge bg-line mr-2">G{m.group_letter}</span>}
                  {m.venue}
                </span>
                <span>{formatCR(m.kickoff_utc)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-right font-medium flex items-center justify-end gap-1.5">
                  <span>{m.home_team}</span>
                  <span className="text-base leading-none">{flagFor(m.home_team)}</span>
                </div>
                <div className="text-center">
                  {pick ? (
                    <>
                      <div className="font-bold text-lg">
                        {pick.home_score}
                        <span className="text-gray-500 mx-1">–</span>
                        {pick.away_score}
                      </div>
                      {pick.advances_team && (
                        <div className="text-[10px] text-gray-500 mt-0.5">avanza {pick.advances_team}</div>
                      )}
                    </>
                  ) : (
                    <div className="text-gray-600">🔒</div>
                  )}
                  {finished && m.home_score !== null && (
                    <div className="text-[11px] text-gray-500 mt-1">
                      Real: {m.home_score} – {m.away_score}
                    </div>
                  )}
                </div>
                <div className="text-left font-medium flex items-center gap-1.5">
                  <span className="text-base leading-none">{flagFor(m.away_team)}</span>
                  <span>{m.away_team}</span>
                </div>
              </div>
              {points !== null && (
                <div className="mt-2 text-right">
                  <span
                    className={`badge font-bold ${
                      points >= 5
                        ? 'bg-gold text-ink'
                        : points >= 3
                        ? 'bg-win text-ink'
                        : 'bg-line text-gray-400'
                    }`}
                  >
                    +{points} pts
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 text-center py-2">
        🔒 = pick oculto hasta que cierre el plazo de esa ronda
      </p>
    </div>
  );
}
