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
      {activeStage === 'group' ? (
        <GroupedView
          matches={activeMatches}
          picks={picks}
          locked={stageIsLocked}
          onChange={onMatchChange}
          config={config}
        />
      ) : (
        <FlatView
          matches={activeMatches}
          picks={picks}
          locked={stageIsLocked}
          onChange={onMatchChange}
          config={config}
        />
      )}
    </div>
  );
}

type ViewProps = {
  matches: Match[];
  picks: Record<number, LocalPick>;
  locked: boolean;
  onChange: (matchId: number, pick: LocalPick | null) => void;
  config: PoolConfig;
};

function pointsFor(
  m: Match,
  p: LocalPick | null,
  config: { pts_exact: number; pts_result: number }
): number | null {
  if (m.status !== 'FINISHED') return null;
  if (!p || p.home_score === '' || p.away_score === '') return null;
  return scorePick(
    {
      home_score: p.home_score as number,
      away_score: p.away_score as number,
      advances_team: p.advances_team
    },
    m,
    config
  );
}

function FlatView({ matches, picks, locked, onChange, config }: ViewProps) {
  if (matches.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Los partidos de esta ronda se publicarán cuando termine la fase anterior.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {matches.map((m) => {
        const p = picks[m.id] ?? null;
        return (
          <MatchPickCard
            key={m.id}
            match={m}
            initialPick={p}
            locked={locked}
            onChange={onChange}
            pointsEarned={pointsFor(m, p, { pts_exact: config.pts_exact, pts_result: config.pts_result })}
          />
        );
      })}
    </div>
  );
}

function GroupedView({ matches, picks, locked, onChange, config }: ViewProps) {
  const groups = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      const g = m.group_letter ?? '?';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [matches]);

  if (groups.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-8">
        Aún no hay partidos cargados.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {groups.map(([letter, list]) => {
        // Cuántos picks llevas en este grupo
        const picked = list.filter((m) => picks[m.id]).length;
        // Puntos del grupo (suma de matches calificados)
        let earned = 0;
        let graded = 0;
        for (const m of list) {
          const pts = pointsFor(m, picks[m.id] ?? null, { pts_exact: config.pts_exact, pts_result: config.pts_result });
          if (pts !== null) {
            earned += pts;
            graded++;
          }
        }
        return (
          <section key={letter} className="card p-4">
            <header className="flex items-center justify-between mb-3 pb-2 border-b border-line">
              <h3 className="font-bold">
                <span className="inline-flex items-center justify-center w-7 h-7 bg-accent text-ink rounded-md text-sm mr-2">
                  {letter}
                </span>
                Grupo {letter}
              </h3>
              <div className="text-right text-xs">
                <div className="text-gray-400">{picked}/6 picks</div>
                {graded > 0 && (
                  <div className="text-accent font-bold">{earned} pts</div>
                )}
              </div>
            </header>
            <div className="space-y-2">
              {list.map((m) => {
                const p = picks[m.id] ?? null;
                return (
                  <MatchPickCard
                    key={m.id}
                    match={m}
                    initialPick={p}
                    locked={locked}
                    onChange={onChange}
                    pointsEarned={pointsFor(m, p, { pts_exact: config.pts_exact, pts_result: config.pts_result })}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
