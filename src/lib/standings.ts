// Cálculo de posiciones de un grupo del Mundial (estilo FIFA simplificado).
// Criterios de orden:
//   1) Puntos (3 por victoria, 1 por empate, 0 por derrota)
//   2) Diferencia de goles
//   3) Goles a favor
//   4) Nombre alfabético (estable, evita reordenamientos visuales)
//
// FIFA usa además: enfrentamiento directo, puntos disciplinarios y sorteo.
// Para una quiniela, los tres primeros criterios son suficientes.

import type { Match } from './types';

export type StandingRow = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type ScorePair = { home_score: number; away_score: number };

/**
 * Calcula los standings de un grupo a partir de los partidos.
 * `resolver(match)` decide qué marcador usar:
 *   - Para "reales": devuelve el marcador final si el match ya terminó, o null si todavía no.
 *   - Para "predicción del usuario": devuelve el pick del usuario para ese match, o null si no hizo pick.
 *
 * Los matches sin marcador se ignoran (no cuentan partidos jugados).
 */
export function computeGroupStandings(
  matches: Match[],
  resolver: (m: Match) => ScorePair | null
): StandingRow[] {
  // Detectamos todos los equipos del grupo
  const teams = new Set<string>();
  for (const m of matches) {
    teams.add(m.home_team);
    teams.add(m.away_team);
  }

  // Inicializamos las filas
  const rows = new Map<string, StandingRow>();
  for (const t of teams) {
    rows.set(t, {
      team: t,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0
    });
  }

  // Procesamos cada match
  for (const m of matches) {
    const result = resolver(m);
    if (!result) continue;

    const home = rows.get(m.home_team)!;
    const away = rows.get(m.away_team)!;

    home.played++;
    away.played++;
    home.goalsFor += result.home_score;
    home.goalsAgainst += result.away_score;
    away.goalsFor += result.away_score;
    away.goalsAgainst += result.home_score;

    if (result.home_score > result.away_score) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (result.home_score < result.away_score) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  // Calculamos diferencia de goles y ordenamos
  const list = Array.from(rows.values());
  for (const r of list) r.goalDiff = r.goalsFor - r.goalsAgainst;

  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team, 'es');
  });

  return list;
}

/**
 * Resolver para el marcador real: devuelve null si el partido no ha terminado.
 */
export function realScoreResolver(m: Match): ScorePair | null {
  if (m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null) {
    return { home_score: m.home_score, away_score: m.away_score };
  }
  return null;
}

/**
 * Resolver para los picks del usuario: usa el pick del map si existe.
 * Cuando se quieren ver los standings "completos" según las predicciones,
 * incluso de partidos no jugados, pasa `includeUnplayed = true`.
 */
export function makePicksResolver(
  picksByMatch: Map<number, ScorePair>,
  includeUnplayed = true
): (m: Match) => ScorePair | null {
  return (m: Match) => {
    const pick = picksByMatch.get(m.id);
    if (!pick) return null;
    if (!includeUnplayed && m.status !== 'FINISHED') return null;
    return pick;
  };
}
