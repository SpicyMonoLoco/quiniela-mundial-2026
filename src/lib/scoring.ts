import type { Match } from './types';

/**
 * Misma lógica que la función SQL `score_pick`, replicada en el cliente
 * para mostrar previews "lo que llevarías ganado" en tiempo real.
 */
export function scorePick(
  pick: { home_score: number; away_score: number; advances_team: string | null } | null,
  match: Pick<Match, 'home_score' | 'away_score' | 'advances_team' | 'stage'>,
  config: { pts_exact: number; pts_result: number }
): number {
  if (!pick) return 0;
  if (match.home_score == null || match.away_score == null) return 0;

  const exactScore = pick.home_score === match.home_score && pick.away_score === match.away_score;
  const isDraw = match.home_score === match.away_score;
  const knockoutDraw = match.stage !== 'group' && isDraw;

  const pickResult = pick.home_score > pick.away_score ? 'H' : pick.home_score < pick.away_score ? 'A' : 'D';
  const realResult = match.home_score > match.away_score ? 'H' : match.home_score < match.away_score ? 'A' : 'D';

  if (exactScore) {
    if (knockoutDraw) {
      if (pick.advances_team && match.advances_team && pick.advances_team === match.advances_team) {
        return config.pts_exact;
      }
      return config.pts_result; // marcador exacto pero falló quién avanza
    }
    return config.pts_exact;
  }

  if (pickResult === realResult) {
    if (knockoutDraw) {
      if (pick.advances_team && match.advances_team && pick.advances_team === match.advances_team) {
        return config.pts_result;
      }
      return 0;
    }
    return config.pts_result;
  }

  return 0;
}

/**
 * ¿Están bloqueados los picks de la fase de grupos?
 */
export function isGroupLocked(config: { group_lock_utc: string }, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(config.group_lock_utc).getTime();
}

/**
 * ¿Están bloqueados los picks de una etapa knockout?
 * Lock = 2h antes del primer kickoff de esa etapa.
 */
export function isKnockoutStageLocked(
  stageMinKickoffUtc: string,
  lockHours: number,
  now: Date = new Date()
): boolean {
  const lockTime = new Date(stageMinKickoffUtc).getTime() - lockHours * 3600 * 1000;
  return now.getTime() >= lockTime;
}
