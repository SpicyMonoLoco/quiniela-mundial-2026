'use client';

import { useMemo, useState } from 'react';
import type { Match, Pick as UserPick } from '@/lib/types';
import {
  computeGroupStandings,
  realScoreResolver,
  makePicksResolver,
  type StandingRow,
  type ScorePair
} from '@/lib/standings';
import { flagFor } from '@/lib/flags';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
type GroupLetter = (typeof GROUPS)[number];

export function GruposClient({ matches, picks }: { matches: Match[]; picks: UserPick[] }) {
  const [group, setGroup] = useState<GroupLetter>('A');

  const matchesByGroup = useMemo(() => {
    const m = new Map<string, Match[]>();
    for (const match of matches) {
      const g = match.group_letter ?? '?';
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(match);
    }
    return m;
  }, [matches]);

  const picksByMatch = useMemo(() => {
    const m = new Map<number, ScorePair>();
    for (const p of picks) m.set(p.match_id, { home_score: p.home_score, away_score: p.away_score });
    return m;
  }, [picks]);

  const groupMatches = matchesByGroup.get(group) ?? [];

  const realStandings = useMemo(
    () => computeGroupStandings(groupMatches, realScoreResolver),
    [groupMatches]
  );

  const predictedStandings = useMemo(
    () => computeGroupStandings(groupMatches, makePicksResolver(picksByMatch, true)),
    [groupMatches, picksByMatch]
  );

  // Cuántos partidos del grupo se han jugado y cuántos picks puso el usuario
  const finishedCount = groupMatches.filter((m) => m.status === 'FINISHED').length;
  const pickedCount = groupMatches.filter((m) => picksByMatch.has(m.id)).length;

  // Mapa de posición real por equipo, para marcar coincidencias en la tabla predicha
  const realPosByTeam = new Map<string, number>();
  realStandings.forEach((r, i) => realPosByTeam.set(r.team, i + 1));

  return (
    <div className="space-y-5">
      <header className="card p-4">
        <h1 className="text-xl font-bold">Posiciones por grupo</h1>
        <p className="text-gray-400 text-sm mt-1">
          Compara cómo va el grupo en la realidad vs cómo lo predijiste tú.
        </p>
      </header>

      {/* Selector de grupo */}
      <div className="flex flex-wrap gap-1.5">
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
              g === group ? 'bg-accent text-ink' : 'bg-line text-gray-300 hover:bg-gray-700'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 flex items-center justify-between px-1">
        <span>
          Grupo {group} · {finishedCount}/6 partidos jugados
        </span>
        <span>{pickedCount}/6 picks tuyos</span>
      </div>

      {/* Tablas */}
      <div className="grid lg:grid-cols-2 gap-4">
        <StandingsTable
          title="Realidad"
          rows={realStandings}
          subtitle={finishedCount === 0 ? 'Aún no hay partidos jugados' : `Después de ${finishedCount} partidos`}
        />
        <StandingsTable
          title="Tu predicción"
          rows={predictedStandings}
          subtitle={pickedCount === 0 ? 'Aún no has hecho picks de este grupo' : `Con tus ${pickedCount} picks`}
          highlightAgainst={realPosByTeam}
          showCompareHint={finishedCount > 0}
        />
      </div>

      <p className="text-xs text-gray-500 text-center py-2">
        Orden: Puntos → Diferencia de goles → Goles a favor
      </p>
    </div>
  );
}

function StandingsTable({
  title,
  rows,
  subtitle,
  highlightAgainst,
  showCompareHint
}: {
  title: string;
  rows: StandingRow[];
  subtitle?: string;
  highlightAgainst?: Map<string, number>;
  showCompareHint?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase">
            <th className="text-left py-1.5 w-6">#</th>
            <th className="text-left">Equipo</th>
            <th className="text-center w-7" title="Partidos jugados">PJ</th>
            <th className="text-center w-7" title="Diferencia de goles">DG</th>
            <th className="text-center w-7" title="Goles a favor">GF</th>
            <th className="text-right w-8" title="Puntos">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pos = i + 1;
            const realPos = highlightAgainst?.get(r.team);
            const matchesReal = highlightAgainst && realPos !== undefined && realPos === pos;
            const advances = pos <= 2; // top 2 avanzan en formato 12 grupos (los 8 mejores 3ros también, pero simplificamos)
            return (
              <tr
                key={r.team}
                className={`border-t border-line ${
                  advances ? '' : ''
                }`}
              >
                <td className="py-2">
                  <span
                    className={`inline-block w-5 h-5 rounded text-xs font-bold text-center leading-5 ${
                      pos === 1
                        ? 'bg-gold text-ink'
                        : pos === 2
                        ? 'bg-accent text-ink'
                        : pos === 3
                        ? 'bg-line text-gray-200'
                        : 'bg-transparent text-gray-500'
                    }`}
                  >
                    {pos}
                  </span>
                </td>
                <td className="py-2 font-medium flex items-center gap-1.5">
                  <span className="text-base leading-none">{flagFor(r.team)}</span>
                  {r.team}
                  {showCompareHint && highlightAgainst && realPos !== undefined && (
                    <span
                      className={`text-[10px] px-1 rounded ${
                        matchesReal ? 'bg-win/20 text-win' : 'bg-lose/20 text-lose'
                      }`}
                      title={matchesReal ? 'Coincide con la realidad' : `Realidad: posición ${realPos}`}
                    >
                      {matchesReal ? '✓' : `→${realPos}`}
                    </span>
                  )}
                </td>
                <td className="text-center text-gray-400">{r.played}</td>
                <td className={`text-center ${r.goalDiff > 0 ? 'text-win' : r.goalDiff < 0 ? 'text-lose' : 'text-gray-400'}`}>
                  {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
                </td>
                <td className="text-center text-gray-300">{r.goalsFor}</td>
                <td className="text-right font-bold text-accent">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] text-gray-600 mt-2">
        <span className="inline-block w-2 h-2 rounded-sm bg-gold mr-1 align-middle" /> 1°
        <span className="inline-block w-2 h-2 rounded-sm bg-accent mx-1 ml-3 align-middle" /> 2°
        — clasificados directos
      </p>
    </div>
  );
}
