// Proyección de equipos en el bracket knockout a partir de los standings
// actuales de los grupos y los resultados de matches knockout finalizados.
//
// Los matches knockout vienen con placeholders como:
//   "1° A"           → ganador del grupo A
//   "2° B"           → 2° del grupo B
//   "Mejor 3° (A/B/C/D/F)" → mejor 3er lugar entre esos 5 grupos
//   "Ganador 73"     → ganador del match 73 (si ya terminó)
//   "Perdedor 101"   → perdedor del match 101 (3er lugar)
//
// Cuando los standings/resultados son suficientes para resolver, esta
// función devuelve el nombre real del equipo. Si no, devuelve null
// (se mantiene el placeholder).

import type { Match } from './types';
import {
  computeGroupStandings,
  realScoreResolver,
  type StandingRow
} from './standings';

export type GroupStandings = Map<string, StandingRow[]>;

/** Devuelve un Map<groupLetter, StandingRow[]> con todos los standings calculados */
export function buildGroupStandings(allMatches: Match[]): GroupStandings {
  const byGroup = new Map<string, Match[]>();
  for (const m of allMatches) {
    if (m.stage !== 'group' || !m.group_letter) continue;
    if (!byGroup.has(m.group_letter)) byGroup.set(m.group_letter, []);
    byGroup.get(m.group_letter)!.push(m);
  }
  const out: GroupStandings = new Map();
  for (const [g, ms] of byGroup) {
    out.set(g, computeGroupStandings(ms, realScoreResolver));
  }
  return out;
}

/** Determina ganador/perdedor de un match knockout terminado */
function getKnockoutOutcome(m: Match): { winner: string; loser: string } | null {
  if (m.home_score == null || m.away_score == null) return null;
  if (m.home_score > m.away_score) {
    return { winner: m.home_team, loser: m.away_team };
  }
  if (m.away_score > m.home_score) {
    return { winner: m.away_team, loser: m.home_team };
  }
  // Empate: depende de advances_team (penales)
  if (m.advances_team) {
    if (m.advances_team === m.home_team) {
      return { winner: m.home_team, loser: m.away_team };
    }
    if (m.advances_team === m.away_team) {
      return { winner: m.away_team, loser: m.home_team };
    }
  }
  return null;
}

/** Map<match_id, {winner, loser}> de todos los matches knockout terminados */
export function buildKnockoutOutcomes(allMatches: Match[]): Map<number, { winner: string; loser: string }> {
  const out = new Map<number, { winner: string; loser: string }>();
  for (const m of allMatches) {
    if (m.stage === 'group') continue;
    const outcome = getKnockoutOutcome(m);
    if (outcome) out.set(m.id, outcome);
  }
  return out;
}

/** Compara dos StandingRow al estilo FIFA: pts → DG → GF (descendente) */
function compareStandingsDesc(a: StandingRow, b: StandingRow): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  return b.goalsFor - a.goalsFor;
}

/**
 * Dado un placeholder, intenta resolverlo al nombre del equipo real.
 * Devuelve null si todavía no se puede resolver (ej. el grupo no terminó).
 */
export function projectTeam(
  placeholder: string,
  standings: GroupStandings,
  outcomes: Map<number, { winner: string; loser: string }>
): string | null {
  if (!placeholder) return null;

  // "1° A" / "2° B"
  let m = /^(\d+)°\s+([A-L])$/.exec(placeholder.trim());
  if (m) {
    const pos = parseInt(m[1], 10);
    const group = m[2];
    const standings_g = standings.get(group);
    if (!standings_g || standings_g.length < pos) return null;
    const row = standings_g[pos - 1];
    // Solo proyectamos si ese equipo ha jugado al menos 1 partido
    if (row.played === 0) return null;
    return row.team;
  }

  // "Mejor 3° (A/B/C/D/F)"
  m = /^Mejor 3°\s+\(([A-L/]+)\)$/.exec(placeholder.trim());
  if (m) {
    const groups = m[1].split('/');
    const candidates: StandingRow[] = [];
    for (const g of groups) {
      const s = standings.get(g);
      if (!s || s.length < 3) continue;
      const third = s[2];
      if (third.played === 0) continue;
      candidates.push(third);
    }
    if (candidates.length === 0) return null;
    candidates.sort(compareStandingsDesc);
    return candidates[0].team;
  }

  // "Ganador 73"
  m = /^Ganador\s+(\d+)$/.exec(placeholder.trim());
  if (m) {
    const matchId = parseInt(m[1], 10);
    return outcomes.get(matchId)?.winner ?? null;
  }

  // "Perdedor 101"
  m = /^Perdedor\s+(\d+)$/.exec(placeholder.trim());
  if (m) {
    const matchId = parseInt(m[1], 10);
    return outcomes.get(matchId)?.loser ?? null;
  }

  // No es placeholder reconocido → ya es un nombre real
  return null;
}

/** Devuelve true si el string parece un placeholder (no un nombre real) */
export function isPlaceholderTeam(name: string): boolean {
  if (!name) return false;
  const t = name.trim();
  return (
    /^\d+°\s+[A-L]$/.test(t) ||
    /^Mejor 3°\s+\([A-L/]+\)$/.test(t) ||
    /^Ganador\s+\d+$/.test(t) ||
    /^Perdedor\s+\d+$/.test(t)
  );
}

/**
 * Aplica proyecciones a todos los matches. Devuelve una nueva lista donde
 * los placeholders están reemplazados con los equipos proyectados cuando
 * es posible. Los matches que ya tienen equipos reales no se tocan.
 */
export function projectAllMatches(allMatches: Match[]): Match[] {
  const standings = buildGroupStandings(allMatches);
  const outcomes = buildKnockoutOutcomes(allMatches);

  return allMatches.map((m) => {
    if (m.stage === 'group') return m;

    let homeTeam = m.home_team;
    let awayTeam = m.away_team;

    if (isPlaceholderTeam(homeTeam)) {
      const projected = projectTeam(homeTeam, standings, outcomes);
      if (projected) homeTeam = projected;
    }
    if (isPlaceholderTeam(awayTeam)) {
      const projected = projectTeam(awayTeam, standings, outcomes);
      if (projected) awayTeam = projected;
    }

    if (homeTeam === m.home_team && awayTeam === m.away_team) return m;
    return { ...m, home_team: homeTeam, away_team: awayTeam };
  });
}
