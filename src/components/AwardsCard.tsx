'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Award, PoolConfig, SpecialPick } from '@/lib/types';

type Props = {
  initialPicks: SpecialPick[];
  config: PoolConfig;
};

const AWARDS: { key: Award; label: string; emoji: string; description: string }[] = [
  {
    key: 'top_scorer',
    label: 'Bota de Oro (máximo goleador)',
    emoji: '👟',
    description: 'El jugador con más goles en todo el torneo'
  },
  {
    key: 'top_assists',
    label: 'Máximo asistidor',
    emoji: '🎯',
    description: 'El jugador con más asistencias en todo el torneo'
  },
  {
    key: 'best_keeper',
    label: 'Guante de Oro (mejor portero)',
    emoji: '🧤',
    description: 'El portero elegido como mejor del torneo'
  },
  {
    key: 'best_player',
    label: 'Balón de Oro (mejor jugador)',
    emoji: '🏆',
    description: 'El MVP del Mundial'
  }
];

function formatLockTime(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  const d = new Date(ms);
  const day = d.toISOString().slice(8, 10);
  const month = d.toLocaleString('es-MX', { month: 'short', timeZone: 'UTC' });
  const time = d.toISOString().slice(11, 16);
  return `${day} ${month} · ${time} CR`;
}

export function AwardsCard({ initialPicks, config }: Props) {
  const initialMap: Record<Award, string> = {
    top_scorer: '',
    top_assists: '',
    best_keeper: '',
    best_player: ''
  };
  for (const p of initialPicks) {
    initialMap[p.award] = p.player_name;
  }

  const [picks, setPicks] = useState<Record<Award, string>>(initialMap);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locks = useMemo(() => {
    const now = Date.now();
    const topLock = config.awards_top_lock_utc ?? config.group_lock_utc;
    const topLocked = now >= new Date(topLock).getTime();
    const semiLocked = config.semi_lock_utc ? now >= new Date(config.semi_lock_utc).getTime() : false;
    return {
      top_scorer: topLocked,
      top_assists: topLocked,
      best_keeper: semiLocked,
      best_player: semiLocked
    } as Record<Award, boolean>;
  }, [config]);

  function getLockInfo(award: Award): { locked: boolean; lockTime: string } {
    if (award === 'top_scorer' || award === 'top_assists') {
      return {
        locked: locks[award],
        lockTime: config.awards_top_lock_utc ?? config.group_lock_utc
      };
    }
    return { locked: locks[award], lockTime: config.semi_lock_utc };
  }

  async function saveAll() {
    setSaving('saving');
    setErrorMsg(null);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setSaving('error');
      setErrorMsg('Sesión expirada.');
      return;
    }

    // Solo enviamos los no bloqueados
    const toSave = AWARDS.filter((a) => !locks[a.key] && picks[a.key]?.trim()).map((a) => ({
      award: a.key,
      player_name: picks[a.key].trim()
    }));

    if (toSave.length === 0) {
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 1500);
      return;
    }

    const res = await fetch('/api/special-picks/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ picks: toSave })
    });
    const j = await res.json();
    if (!j.ok) {
      setSaving('error');
      setErrorMsg(j.error ?? 'No se pudo guardar');
      return;
    }
    setSaving('saved');
    setTimeout(() => setSaving('idle'), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="font-bold text-lg">🏆 Premios individuales</h2>
            <p className="text-xs text-gray-400 mt-1">
              Acertar cada uno te da <span className="text-gold font-semibold">{config.pts_award} pts</span>.
              Cada premio tiene su propio cierre — mira la fecha abajo de cada card.
            </p>
          </div>
          <button
            onClick={saveAll}
            disabled={saving === 'saving'}
            className="btn-primary text-sm shrink-0"
          >
            {saving === 'saving' && 'Guardando…'}
            {saving === 'saved' && '✓ Guardado'}
            {saving === 'error' && 'Reintentar'}
            {saving === 'idle' && 'Guardar premios'}
          </button>
        </div>
        {errorMsg && <p className="text-sm text-lose mt-2">{errorMsg}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {AWARDS.map((a) => {
          const lockInfo = getLockInfo(a.key);
          const value = picks[a.key];
          return (
            <div key={a.key} className="card p-4">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-semibold text-sm">
                  <span className="mr-1.5">{a.emoji}</span>
                  {a.label}
                </h3>
                {lockInfo.locked ? (
                  <span className="text-xs text-lose">🔒 Cerrado</span>
                ) : (
                  <span className="text-[10px] text-gray-500">
                    Cierra {formatLockTime(lockInfo.lockTime)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3">{a.description}</p>
              <input
                type="text"
                placeholder="Ej. Lionel Messi"
                disabled={lockInfo.locked}
                value={value}
                onChange={(e) =>
                  setPicks((prev) => ({ ...prev, [a.key]: e.target.value }))
                }
                className="w-full px-3 py-2 bg-ink border border-line rounded-lg text-sm
                           focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-500 text-center px-4">
        💡 Tip: escribe el nombre exacto (sin acentos da igual). El admin valida al final del torneo.
      </p>
    </div>
  );
}
