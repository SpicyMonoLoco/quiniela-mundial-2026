'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MatchPickCard } from '@/components/MatchPickCard';
import { scorePick, isGroupLocked, isKnockoutStageLocked } from '@/lib/scoring';
import type { Match, Pick, PoolConfig } from '@/lib/types';

type LocalPick = {
  home_score: number | '';
  away_score: number | '';
  advances_team: string | null;
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

export function PicksClient({
  matches,
  initialPicks,
  config
}: {
  matches: Match[];
  initialPicks: Pick[];
  config: PoolConfig;
}) {
  const initialMap: Record<number, LocalPick> = {};
  for (const p of initialPicks) {
    initialMap[p.match_id] = {
      home_score: p.home_score,
      away_score: p.away_score,
      advances_team: p.advances_team
    };
  }

  const [picks, setPicks] = useState<Record<number, LocalPick>>(initialMap);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Agrupar por etapa
  const stageMins = useMemo(() => {
    const m: Record<string, string> = {};
    for (const match of matches) {
      if (!m[match.stage] || match.kickoff_utc < m[match.stage]) m[match.stage] = match.kickoff_utc;
    }
    return m;
  }, [matches]);

  const lockedForStage = (stage: Match['stage']) => {
    if (stage === 'group') return isGroupLocked(config);
    const minKickoff = stageMins[stage];
    if (!minKickoff) return false;
    return isKnockoutStageLocked(minKickoff, config.knockout_lock_hours);
  };

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

  function onMatchChange(matchId: number, newPick: LocalPick | null) {
    setPicks((prev) => {
      const next = { ...prev };
      if (newPick === null) delete next[matchId];
      else next[matchId] = newPick;
      return next;
    });
  }

  async function saveAll() {
    setSaving('saving');
    setErrorMsg(null);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setSaving('error');
      setErrorMsg('Sesión expirada. Recarga la página.');
      return;
    }

    // Solo guardar los picks de etapas no bloqueadas
    const rows: Pick[] = [];
    for (const m of matches) {
      const p = picks[m.id];
      if (!p) continue;
      if (p.home_score === '' || p.away_score === '') continue;
      if (lockedForStage(m.stage)) continue;
      rows.push({
        user_id: userId,
        match_id: m.id,
        home_score: p.home_score as number,
        away_score: p.away_score as number,
        advances_team:
          m.stage !== 'group' && p.home_score === p.away_score ? p.advances_team : null,
        updated_at: new Date().toISOString()
      });
    }

    if (rows.length === 0) {
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 1500);
      return;
    }

    const { error } = await supabase.from('picks').upsert(rows, { onConflict: 'user_id,match_id' });
    if (error) {
      setSaving('error');
      setErrorMsg(error.message);
      return;
    }
    setSaving('saved');
    setTimeout(() => setSaving('idle'), 2000);
  }

  const totalPoints = useMemo(() => {
    let total = 0;
    for (const m of matches) {
      if (m.status !== 'FINISHED') continue;
      const p = picks[m.id];
      if (!p || p.home_score === '' || p.away_score === '') continue;
      total += scorePick(
        { home_score: p.home_score as number, away_score: p.away_score as number, advances_team: p.advances_team },
        m,
        { pts_exact: config.pts_exact, pts_result: config.pts_result }
      );
    }
    return total;
  }, [matches, picks, config]);

  const activeMatches = stages.find((s) => s.stage === activeStage)?.matches ?? [];
  const stageIsLocked = lockedForStage(activeStage);
  const lockMessage =
    activeStage === 'group'
      ? `Picks bloqueados (cierre ${new Date(config.group_lock_utc).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })})`
      : `Picks bloqueados 2h antes del primer match de esta ronda`;

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="card p-4 flex items-center justify-between sticky top-14 z-[5] bg-card/95 backdrop-blur">
        <div>
          <p className="text-xs text-gray-400">Tus puntos</p>
          <p className="text-2xl font-bold text-accent">{totalPoints}</p>
        </div>
        <button
          onClick={saveAll}
          disabled={saving === 'saving'}
          className="btn-primary"
        >
          {saving === 'saving' && 'Guardando…'}
          {saving === 'saved' && '✓ Guardado'}
          {saving === 'error' && 'Reintentar'}
          {saving === 'idle' && 'Guardar picks'}
        </button>
      </div>

      {errorMsg && <p className="text-sm text-lose px-2">{errorMsg}</p>}

      {/* Tabs de etapas */}
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

      {stageIsLocked && (
        <div className="card p-3 border-lose/40 text-center text-sm text-lose">🔒 {lockMessage}</div>
      )}

      {/* Lista de partidos */}
      <div className="space-y-3">
        {activeMatches.map((m) => {
          const p = picks[m.id] ?? null;
          const matchLocked = stageIsLocked;
          const points =
            m.status === 'FINISHED' && p && p.home_score !== '' && p.away_score !== ''
              ? scorePick(
                  {
                    home_score: p.home_score as number,
                    away_score: p.away_score as number,
                    advances_team: p.advances_team
                  },
                  m,
                  { pts_exact: config.pts_exact, pts_result: config.pts_result }
                )
              : null;
          return (
            <MatchPickCard
              key={m.id}
              match={m}
              initialPick={p}
              locked={matchLocked}
              onChange={onMatchChange}
              pointsEarned={points}
            />
          );
        })}
        {activeMatches.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Los partidos de esta ronda se publicarán cuando termine la fase anterior.
          </p>
        )}
      </div>
    </div>
  );
}
