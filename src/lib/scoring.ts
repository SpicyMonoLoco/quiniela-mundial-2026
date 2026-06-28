import type { Match } from './types';

/**
 * Misma lógica que la función SQL `score_pick`, replicada en el cliente
 * para mostrar previews "lo que llevarías ganado" en tiempo real.
 *
 * Reglas (votadas por el grupo):
 *  - Base: 5 marcador exacto / 3 resultado correcto / 0 falla (en 120 min).
 *  - Extra +1 si knockout fue a penales Y el usuario predijo correctamente
 *    quién avanza:
 *      · Pick empate → pick.advances_team
 *      · Pick no-empate → el equipo con mayor score predicho (implícito)
 */
export function scorePick(
  pick: { home_score: number; away_score: number; advances_team: string | null } | null,
  match: Pick<Match, 'home_score' | 'away_score' | 'advances_team' | 'stage' | 'home_team' | 'away_team'>,
  config: { pts_exact: number; pts_result: number }
): number {
  if (!pick) return 0;
  if (match.home_score == null || match.away_score == null) return 0;

  // Base score
  let base = 0;
  const exactScore = pick.home_score === match.home_score && pick.away_score === match.away_score;
  if (exactScore) {
    base = config.pts_exact;
  } else {
    const pickResult = pick.home_score > pick.away_score ? 'H' : pick.home_score < pick.away_score ? 'A' : 'D';
    const realResult = match.home_score > match.away_score ? 'H' : match.home_score < match.away_score ? 'A' : 'D';
    if (pickResult === realResult) {
      base = config.pts_result;
    }
  }

  // Extra +1 solo en knockout y solo si el match fue a penales (advances_team del match seteado)
  let extra = 0;
  if (match.stage !== 'group' && match.advances_team) {
    let predictedAdvancer: string | null = null;
    if (pick.home_score === pick.away_score) {
      predictedAdvancer = pick.advances_team;
    } else if (pick.home_score > pick.away_score) {
      predictedAdvancer = match.home_team;
    } else {
      predictedAdvancer = match.away_team;
    }

    if (predictedAdvancer && norm(predictedAdvancer) === norm(match.advances_team)) {
      extra = 1;
    }
  }

  return base + extra;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * ¿Están bloqueados los picks de la fase de grupos?
 */
export function isGroupLocked(config: { group_lock_utc: string }, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(config.group_lock_utc).getTime();
}

/**
 * ¿Está bloqueado el pick de un partido knockout individual?
 * Lock = 1h antes del kickoff del partido.
 */
export function isKnockoutMatchLocked(
  matchKickoffUtc: string,
  lockHours: number,
  now: Date = new Date()
): boolean {
  const lockTime = new Date(matchKickoffUtc).getTime() - lockHours * 3600 * 1000;
  return now.getTime() >= lockTime;
}
