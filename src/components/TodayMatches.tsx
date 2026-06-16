'use client';

import { useState } from 'react';
import type { Match, PoolConfig } from '@/lib/types';
import { flagFor } from '@/lib/flags';

export type SimplePick = {
  match_id: number;
  user_id: string;
  display_name: string;
  home_score: number;
  away_score: number;
  points: number;
};

function formatTime(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  return d.toISOString().slice(11, 16);
}

function statusBadge(m: Match) {
  if (m.status === 'LIVE') {
    return <span className="badge bg-lose/15 text-lose border border-lose/40 animate-pulse">🔴 EN VIVO</span>;
  }
  if (m.home_score !== null && m.away_score !== null) {
    return <span className="badge bg-win/15 text-win border border-win/30">✓ FINAL</span>;
  }
  return <span className="badge bg-line text-gray-300">Pendiente</span>;
}

export function TodayMatches({
  matches,
  picks,
  config,
  selfId
}: {
  matches: Match[];
  picks: SimplePick[];
  config: PoolConfig;
  selfId: string;
}) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const picksByMatch = new Map<number, SimplePick[]>();
  for (const p of picks) {
    if (!picksByMatch.has(p.match_id)) picksByMatch.set(p.match_id, []);
    picksByMatch.get(p.match_id)!.push(p);
  }

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (matches.length === 0) return null;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lose opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-lose" />
          </span>
          Partidos de hoy
        </h2>
        <span className="text-xs text-gray-500">{matches.length} {matches.length === 1 ? 'partido' : 'partidos'}</span>
      </div>

      <div className="space-y-3">
        {matches.map((m) => {
          const matchPicks = picksByMatch.get(m.id) ?? [];
          const hasResult = m.home_score !== null && m.away_score !== null;
          const isOpen = expanded.has(m.id);

          // Stats
          const exactCount = matchPicks.filter((p) => p.points === config.pts_exact).length;
          const resultCount = matchPicks.filter((p) => p.points === config.pts_result).length;
          const wrongCount = matchPicks.filter((p) => p.points === 0 && hasResult).length;

          // Sort: self primero, después por puntos desc, después alfa
          const sorted = [...matchPicks].sort((a, b) => {
            if (a.user_id === selfId) return -1;
            if (b.user_id === selfId) return 1;
            if (b.points !== a.points) return b.points - a.points;
            return a.display_name.localeCompare(b.display_name);
          });

          return (
            <div
              key={m.id}
              className={`border rounded-xl overflow-hidden transition ${
                m.status === 'LIVE' ? 'border-lose/40 bg-lose/[0.03]' : 'border-line bg-ink/40'
              }`}
            >
              {/* Header */}
              <div className="p-3">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                  <span>
                    {m.group_letter && <span className="badge bg-line mr-1.5">G{m.group_letter}</span>}
                    {formatTime(m.kickoff_utc)} CR · {m.venue}
                  </span>
                  {statusBadge(m)}
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="text-right font-semibold flex items-center justify-end gap-1.5 text-sm">
                    <span>{m.home_team}</span>
                    <span className="text-lg leading-none shrink-0">{flagFor(m.home_team)}</span>
                  </div>
                  <div className="text-center font-bold text-xl tabular-nums px-3 shrink-0">
                    {hasResult ? (
                      <span className={m.status === 'LIVE' ? 'text-lose' : 'text-accent'}>
                        {m.home_score} – {m.away_score}
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">– vs –</span>
                    )}
                  </div>
                  <div className="text-left font-semibold flex items-center gap-1.5 text-sm">
                    <span className="text-lg leading-none shrink-0">{flagFor(m.away_team)}</span>
                    <span>{m.away_team}</span>
                  </div>
                </div>

                {/* Footer con stats + toggle */}
                <div className="flex items-center justify-between mt-3 gap-2">
                  {matchPicks.length === 0 ? (
                    <span className="text-[11px] text-gray-500">Picks ocultos hasta el cierre</span>
                  ) : hasResult ? (
                    <div className="flex gap-1.5 text-[11px]">
                      <span className="text-gold">{exactCount} 🎯</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-win">{resultCount} ✓</span>
                      <span className="text-gray-600">·</span>
                      <span className="text-lose">{wrongCount} ✗</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">{matchPicks.length} picks</span>
                  )}

                  {matchPicks.length > 0 && (
                    <button
                      onClick={() => toggle(m.id)}
                      className="text-xs text-accent hover:underline"
                    >
                      {isOpen ? 'Ocultar picks ▴' : 'Ver picks ▾'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded picks */}
              {isOpen && matchPicks.length > 0 && (
                <div className="border-t border-line bg-ink/60 px-3 py-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {sorted.map((p) => {
                      const isSelf = p.user_id === selfId;
                      const colorClass = !hasResult
                        ? 'bg-ink border-line text-gray-300'
                        : p.points === config.pts_exact
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : p.points === config.pts_result
                        ? 'bg-win/15 border-win/40 text-win'
                        : 'bg-lose/10 border-lose/30 text-gray-400';
                      return (
                        <div
                          key={p.user_id}
                          className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-md border ${colorClass} ${
                            isSelf ? 'ring-2 ring-accent/40' : ''
                          }`}
                        >
                          <span className="truncate font-medium">
                            {p.display_name}
                            {isSelf && <span className="ml-1 text-[9px] opacity-60">tú</span>}
                          </span>
                          <span className="font-bold tabular-nums shrink-0 ml-2">
                            {p.home_score}-{p.away_score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
