'use client';

import { useMemo, useState } from 'react';
import type { Match, PoolConfig } from '@/lib/types';
import type { MatchPick } from './page';
import { flagFor } from '@/lib/flags';

type StageGroup = 'group' | 'knockout';
type GroupFilter = 'all' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

const STAGE_LABELS_KO: Record<Match['stage'], string> = {
  group: 'Grupos',
  r32: 'Dieciseisavos',
  r16: 'Octavos',
  qf: 'Cuartos',
  sf: 'Semis',
  tp: '3er lugar',
  final: 'Final'
};

function formatDate(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
  return `${day} ${month}`;
}

export function ResultadosClient({
  matches,
  allPicks,
  config,
  selfId
}: {
  matches: Match[];
  allPicks: MatchPick[];
  config: PoolConfig;
  selfId: string;
}) {
  const [stageGroup, setStageGroup] = useState<StageGroup>('group');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  // Agrupar picks por match_id
  const picksByMatch = useMemo(() => {
    const map = new Map<number, MatchPick[]>();
    for (const p of allPicks) {
      if (!map.has(p.match_id)) map.set(p.match_id, []);
      map.get(p.match_id)!.push(p);
    }
    return map;
  }, [allPicks]);

  // Filtrar matches por stage y group
  const visibleMatches = useMemo(() => {
    let arr = matches.filter((m) =>
      stageGroup === 'group' ? m.stage === 'group' : m.stage !== 'group'
    );
    if (stageGroup === 'group' && groupFilter !== 'all') {
      arr = arr.filter((m) => m.group_letter === groupFilter);
    }
    // Solo matches con resultado o que ya pasó su lock (con picks visibles)
    arr = arr.filter((m) => {
      const hasResult = m.home_score !== null && m.away_score !== null;
      const hasPicks = (picksByMatch.get(m.id)?.length ?? 0) > 0;
      return hasResult || hasPicks;
    });
    return arr;
  }, [matches, picksByMatch, stageGroup, groupFilter]);

  // Stats globales (del filtro actual)
  const stats = useMemo(() => {
    let scored = 0;
    let exactTotal = 0;
    let resultTotal = 0;
    let wrongTotal = 0;
    for (const m of visibleMatches) {
      const hasResult = m.home_score !== null && m.away_score !== null;
      if (!hasResult) continue;
      scored++;
      const picks = picksByMatch.get(m.id) ?? [];
      for (const p of picks) {
        if (p.points === config.pts_exact) exactTotal++;
        else if (p.points === config.pts_result) resultTotal++;
        else wrongTotal++;
      }
    }
    return { scored, exactTotal, resultTotal, wrongTotal };
  }, [visibleMatches, picksByMatch, config]);

  function toggleExpand(matchId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }

  function expandAll() {
    setExpanded(new Set(visibleMatches.map((m) => m.id)));
  }

  function collapseAll() {
    setExpanded(new Set());
  }

  const stageBreakdown = useMemo(() => {
    if (stageGroup === 'group') return null;
    // Cuántos picks en cada subetapa de knockout
    const counts: Partial<Record<Match['stage'], number>> = {};
    for (const m of matches) {
      if (m.stage === 'group') continue;
      const has = (picksByMatch.get(m.id)?.length ?? 0) > 0 || (m.home_score !== null);
      if (has) counts[m.stage] = (counts[m.stage] ?? 0) + 1;
    }
    return counts;
  }, [matches, picksByMatch, stageGroup]);

  return (
    <div className="space-y-5">
      {/* Top tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setStageGroup('group');
            setGroupFilter('all');
            setExpanded(new Set());
          }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
            stageGroup === 'group'
              ? 'bg-accent text-ink'
              : 'bg-line text-gray-300 hover:bg-gray-700'
          }`}
        >
          ⚽ Fase de grupos
        </button>
        <button
          onClick={() => {
            setStageGroup('knockout');
            setExpanded(new Set());
          }}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
            stageGroup === 'knockout'
              ? 'bg-accent text-ink'
              : 'bg-line text-gray-300 hover:bg-gray-700'
          }`}
        >
          🏆 Eliminatorias
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Partidos calificados" value={stats.scored} color="text-gray-200" />
        <StatCard label="Exactos totales" value={stats.exactTotal} color="text-gold" small={`× ${config.pts_exact} pts`} />
        <StatCard label="Resultados correctos" value={stats.resultTotal} color="text-win" small={`× ${config.pts_result} pts`} />
        <StatCard label="Fallados" value={stats.wrongTotal} color="text-lose" small="0 pts" />
      </div>

      {/* Filtros y controles */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {stageGroup === 'group' ? (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setGroupFilter('all')}
              className={`px-2.5 py-1 text-xs rounded-md ${
                groupFilter === 'all' ? 'bg-accent text-ink font-medium' : 'bg-line text-gray-300'
              }`}
            >
              Todos
            </button>
            {(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`w-7 h-7 text-xs rounded-md font-bold ${
                  groupFilter === g ? 'bg-accent text-ink' : 'bg-line text-gray-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400">
            Mostrando matches knockout con picks visibles
          </div>
        )}

        <div className="flex gap-2 text-xs">
          <button onClick={expandAll} className="text-accent hover:underline">Expandir todos</button>
          <button onClick={collapseAll} className="text-gray-400 hover:text-white">Cerrar todos</button>
        </div>
      </div>

      {/* Lista de matches */}
      <div className="space-y-3">
        {visibleMatches.length === 0 ? (
          <p className="card p-6 text-center text-sm text-gray-500">
            Todavía no hay matches con picks visibles para mostrar.
            <br />
            <span className="text-xs">Los picks de cada ronda se hacen públicos cuando se cierra el plazo de esa etapa.</span>
          </p>
        ) : (
          visibleMatches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              picks={picksByMatch.get(m.id) ?? []}
              expanded={expanded.has(m.id)}
              onToggle={() => toggleExpand(m.id)}
              config={config}
              selfId={selfId}
            />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  small
}: {
  label: string;
  value: number;
  color: string;
  small?: string;
}) {
  return (
    <div className="card p-3">
      <p className="text-[10px] uppercase text-gray-500 tracking-wider">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {small && <p className="text-[10px] text-gray-500 mt-0.5">{small}</p>}
    </div>
  );
}

function MatchCard({
  match,
  picks,
  expanded,
  onToggle,
  config,
  selfId
}: {
  match: Match;
  picks: MatchPick[];
  expanded: boolean;
  onToggle: () => void;
  config: PoolConfig;
  selfId: string;
}) {
  const hasResult = match.home_score !== null && match.away_score !== null;

  // Agrupar picks por categoría
  const grouped = useMemo(() => {
    const exact: MatchPick[] = [];
    const result: MatchPick[] = [];
    const wrong: MatchPick[] = [];
    for (const p of picks) {
      if (!hasResult) {
        wrong.push(p);
        continue;
      }
      if (p.points === config.pts_exact) exact.push(p);
      else if (p.points === config.pts_result) result.push(p);
      else wrong.push(p);
    }
    // Sort: self primero, después alfa
    const sortFn = (a: MatchPick, b: MatchPick) => {
      if (a.user_id === selfId) return -1;
      if (b.user_id === selfId) return 1;
      return a.display_name.localeCompare(b.display_name);
    };
    return {
      exact: exact.sort(sortFn),
      result: result.sort(sortFn),
      wrong: wrong.sort(sortFn)
    };
  }, [picks, hasResult, config, selfId]);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
          <span>
            {match.group_letter && (
              <span className="badge bg-line mr-2">G{match.group_letter}</span>
            )}
            {formatDate(match.kickoff_utc)} · {match.venue}
          </span>
          <span className="uppercase text-[10px]">
            {match.stage === 'group' ? `J${match.matchday}` : STAGE_LABELS_KO[match.stage]}
          </span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-3">
          <div className="text-right font-semibold flex items-center justify-end gap-1.5">
            <span>{match.home_team}</span>
            <span className="text-lg">{flagFor(match.home_team)}</span>
          </div>
          <div className="text-center font-bold text-2xl tabular-nums px-2">
            {hasResult ? (
              <span className="text-accent">{match.home_score} – {match.away_score}</span>
            ) : (
              <span className="text-gray-600 text-sm">– vs –</span>
            )}
          </div>
          <div className="text-left font-semibold flex items-center gap-1.5">
            <span className="text-lg">{flagFor(match.away_team)}</span>
            <span>{match.away_team}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            <Badge count={grouped.exact.length} label="Exactos" color="bg-gold/15 text-gold border-gold/30" />
            <Badge count={grouped.result.length} label="Resultado" color="bg-win/15 text-win border-win/30" />
            <Badge count={grouped.wrong.length} label="Fallados" color="bg-lose/10 text-lose border-lose/30" />
          </div>
          <button
            onClick={onToggle}
            className="text-xs text-accent hover:underline whitespace-nowrap"
          >
            {expanded ? 'Ocultar picks ▴' : 'Ver picks ▾'}
          </button>
        </div>
      </div>

      {/* Expandable picks */}
      {expanded && (
        <div className="border-t border-line bg-ink/40 p-4 space-y-3">
          {grouped.exact.length > 0 && (
            <PickGroup
              title="Marcador exacto"
              points={`+${config.pts_exact} pts`}
              color="border-l-gold"
              picks={grouped.exact}
              selfId={selfId}
            />
          )}
          {grouped.result.length > 0 && (
            <PickGroup
              title="Resultado correcto"
              points={`+${config.pts_result} pts`}
              color="border-l-win"
              picks={grouped.result}
              selfId={selfId}
            />
          )}
          {grouped.wrong.length > 0 && (
            <PickGroup
              title={hasResult ? 'Fallados' : 'Sin calificar'}
              points={hasResult ? '0 pts' : 'sin resultado'}
              color="border-l-lose"
              picks={grouped.wrong}
              selfId={selfId}
            />
          )}
          {picks.length === 0 && (
            <p className="text-center text-xs text-gray-500 py-3">
              Nadie hizo pick para este partido.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Badge({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border ${color}`}>
      <span className="font-bold">{count}</span>
      <span>{label}</span>
    </span>
  );
}

function PickGroup({
  title,
  points,
  color,
  picks,
  selfId
}: {
  title: string;
  points: string;
  color: string;
  picks: MatchPick[];
  selfId: string;
}) {
  return (
    <div className={`pl-3 border-l-2 ${color}`}>
      <div className="flex items-baseline justify-between mb-2">
        <h4 className="text-[11px] uppercase tracking-wider font-semibold text-gray-300">
          {title}
        </h4>
        <span className="text-[10px] text-gray-500">{points} · {picks.length}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {picks.map((p) => {
          const isSelf = p.user_id === selfId;
          return (
            <div
              key={p.user_id}
              className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md border ${
                isSelf
                  ? 'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-ink/60 border-line text-gray-300'
              }`}
            >
              <span className="truncate font-medium">
                {p.display_name}
                {isSelf && <span className="ml-1 text-[10px] opacity-75">(tú)</span>}
              </span>
              <span className="font-bold tabular-nums shrink-0 ml-2">
                {p.home_score}-{p.away_score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
