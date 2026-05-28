'use client';

import { useState } from 'react';
import type { Match } from '@/lib/types';
import { flagFor } from '@/lib/flags';

type LocalPick = {
  home_score: number | '';
  away_score: number | '';
  advances_team: string | null;
};

type Props = {
  match: Match;
  initialPick: LocalPick | null;
  locked: boolean;
  onChange: (matchId: number, pick: LocalPick | null) => void;
  pointsEarned?: number | null;
};

function formatKickoff(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const dayName = d.toLocaleString('es-MX', { weekday: 'short', timeZone: 'UTC' });
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${dayName} ${day} ${month} · ${time} CDMX`;
}

export function MatchPickCard({ match, initialPick, locked, onChange, pointsEarned }: Props) {
  const [home, setHome] = useState<number | ''>(initialPick?.home_score ?? '');
  const [away, setAway] = useState<number | ''>(initialPick?.away_score ?? '');
  const [advances, setAdvances] = useState<string | null>(initialPick?.advances_team ?? null);

  const isDraw = home !== '' && away !== '' && home === away;
  const isKnockout = match.stage !== 'group';
  const showAdvancesPicker = isKnockout && isDraw;

  function update(nextHome: number | '' = home, nextAway: number | '' = away, nextAdv: string | null = advances) {
    setHome(nextHome);
    setAway(nextAway);
    setAdvances(nextAdv);

    if (nextHome === '' || nextAway === '') {
      onChange(match.id, null);
      return;
    }
    onChange(match.id, {
      home_score: nextHome,
      away_score: nextAway,
      advances_team: isKnockout && nextHome === nextAway ? nextAdv : null
    });
  }

  const finished = match.status === 'FINISHED';

  return (
    <div className={`card p-4 ${locked ? 'opacity-90' : ''}`}>
      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
        <span>
          {match.group_letter && <span className="badge bg-line mr-2">G{match.group_letter}</span>}
          {match.venue} · {match.city}
        </span>
        <span>{formatKickoff(match.kickoff_utc)}</span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right">
          <div className="font-semibold flex items-center justify-end gap-1.5">
            <span>{match.home_team}</span>
            <span className="text-lg leading-none">{flagFor(match.home_team)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={20}
            disabled={locked}
            value={home}
            onChange={(e) => {
              const v = e.target.value === '' ? '' : Math.max(0, Math.min(20, parseInt(e.target.value, 10)));
              update(v as number | '', away, advances);
            }}
            className="input-score"
            placeholder="–"
          />
          <span className="text-gray-500">–</span>
          <input
            type="number"
            min={0}
            max={20}
            disabled={locked}
            value={away}
            onChange={(e) => {
              const v = e.target.value === '' ? '' : Math.max(0, Math.min(20, parseInt(e.target.value, 10)));
              update(home, v as number | '', advances);
            }}
            className="input-score"
            placeholder="–"
          />
        </div>
        <div className="text-left">
          <div className="font-semibold flex items-center gap-1.5">
            <span className="text-lg leading-none">{flagFor(match.away_team)}</span>
            <span>{match.away_team}</span>
          </div>
        </div>
      </div>

      {showAdvancesPicker && (
        <div className="mt-3 p-2 bg-ink rounded-lg border border-line">
          <p className="text-xs text-gray-400 mb-2">¿Quién avanza por penales?</p>
          <div className="flex gap-2">
            {[match.home_team, match.away_team].map((team) => (
              <button
                key={team}
                type="button"
                disabled={locked}
                onClick={() => update(home, away, team)}
                className={`flex-1 py-1.5 px-2 text-sm rounded-md border transition ${
                  advances === team
                    ? 'bg-accent text-ink border-accent font-medium'
                    : 'bg-transparent border-line text-gray-300 hover:border-accent'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        </div>
      )}

      {finished && (
        <div className="mt-3 flex items-center justify-between text-sm border-t border-line pt-3">
          <span className="text-gray-400">
            Resultado: <span className="font-bold text-white">{match.home_score} – {match.away_score}</span>
            {match.advances_team && (
              <span className="ml-2 text-xs text-gray-500">
                (avanza {match.advances_team})
              </span>
            )}
          </span>
          {pointsEarned !== null && pointsEarned !== undefined && (
            <span
              className={`badge font-bold ${
                pointsEarned >= 5 ? 'bg-gold text-ink' : pointsEarned >= 3 ? 'bg-win text-ink' : 'bg-line text-gray-400'
              }`}
            >
              +{pointsEarned} pts
            </span>
          )}
        </div>
      )}
    </div>
  );
}
