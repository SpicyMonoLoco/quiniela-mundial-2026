'use client';

import { useMemo, useState } from 'react';
import type { Match } from '@/lib/types';

export function AdminClient({ matches: initial }: { matches: Match[] }) {
  const [matches, setMatches] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function seedMatches() {
    setBusy('seed');
    setMsg(null);
    const res = await fetch('/api/admin/seed', { method: 'POST' });
    const j = await res.json();
    setMsg(j.ok ? `✓ ${j.inserted} partidos cargados` : `Error: ${j.error}`);
    setBusy(null);
    if (j.ok) {
      const refreshed = await fetch('/api/admin/matches').then((r) => r.json());
      if (refreshed.matches) setMatches(refreshed.matches);
    }
  }

  async function refreshResults() {
    setBusy('refresh');
    setMsg(null);
    const res = await fetch('/api/results/refresh', { method: 'POST' });
    const j = await res.json();
    setMsg(j.ok ? `✓ ${j.updated ?? 0} resultados actualizados` : `Error: ${j.error}`);
    setBusy(null);
    if (j.ok) {
      const refreshed = await fetch('/api/admin/matches').then((r) => r.json());
      if (refreshed.matches) setMatches(refreshed.matches);
    }
  }

  async function saveResult(matchId: number, body: Record<string, unknown>) {
    setBusy(`m${matchId}`);
    const res = await fetch(`/api/admin/results/${matchId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    setMsg(j.ok ? `✓ Match ${matchId} guardado` : `Error: ${j.error}`);
    setBusy(null);
    if (j.ok && j.match) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? j.match : m)));
    }
  }

  async function saveMatchMeta(matchId: number, body: Record<string, unknown>) {
    setBusy(`e${matchId}`);
    const res = await fetch(`/api/admin/match/${matchId}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    setMsg(j.ok ? `✓ Match ${matchId} actualizado` : `Error: ${j.error}`);
    setBusy(null);
    if (j.ok && j.match) {
      setMatches((prev) => prev.map((m) => (m.id === matchId ? j.match : m)));
    }
  }

  const byStage = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of matches) {
      if (!map.has(m.stage)) map.set(m.stage, []);
      map.get(m.stage)!.push(m);
    }
    return map;
  }, [matches]);

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <h1 className="text-xl font-bold mb-1">Panel de admin</h1>
        <p className="text-gray-400 text-sm">Carga inicial, refresco de resultados y captura manual.</p>

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={seedMatches} disabled={busy === 'seed'} className="btn-primary">
            {busy === 'seed' ? 'Cargando…' : '1. Cargar / actualizar los 104 partidos'}
          </button>
          <button onClick={refreshResults} disabled={busy === 'refresh'} className="btn-ghost">
            {busy === 'refresh' ? 'Actualizando…' : '🔄 Traer resultados (football-data.org)'}
          </button>
        </div>
        {msg && <p className="text-sm mt-3 text-accent">{msg}</p>}
      </section>

      {Array.from(byStage.entries()).map(([stage, list]) => (
        <section key={stage} className="card p-5">
          <h2 className="font-semibold mb-3 capitalize">{stage}</h2>
          <div className="space-y-2">
            {list.map((m) => (
              <AdminMatchRow
                key={m.id}
                match={m}
                onSave={(body) => saveResult(m.id, body)}
                onSaveMeta={(body) => saveMatchMeta(m.id, body)}
                busy={busy === `m${m.id}`}
                busyMeta={busy === `e${m.id}`}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Convierte ISO UTC ("2026-06-28T19:00:00Z") a formato datetime-local en CR (UTC-6)
function isoToCrDatetimeLocal(iso: string): string {
  const ms = new Date(iso).getTime() - 6 * 3600 * 1000;
  return new Date(ms).toISOString().slice(0, 16);
}

// Convierte datetime-local en CR a ISO UTC
function crDatetimeLocalToIso(local: string): string {
  // local viene como "2026-06-28T13:00" (sin tz). Lo tratamos como CR (UTC-6).
  const ms = new Date(local + 'Z').getTime() + 6 * 3600 * 1000;
  return new Date(ms).toISOString();
}

function AdminMatchRow({
  match,
  onSave,
  onSaveMeta,
  busy,
  busyMeta
}: {
  match: Match;
  onSave: (body: Record<string, unknown>) => void;
  onSaveMeta: (body: Record<string, unknown>) => void;
  busy: boolean;
  busyMeta: boolean;
}) {
  const [home, setHome] = useState<string>(match.home_score?.toString() ?? '');
  const [away, setAway] = useState<string>(match.away_score?.toString() ?? '');
  const [adv, setAdv] = useState<string>(match.advances_team ?? '');
  const [status, setStatus] = useState<string>(match.status);
  const [editOpen, setEditOpen] = useState(false);
  const [homeTeam, setHomeTeam] = useState(match.home_team);
  const [awayTeam, setAwayTeam] = useState(match.away_team);
  const [kickoff, setKickoff] = useState(isoToCrDatetimeLocal(match.kickoff_utc));

  const isDraw = home !== '' && away !== '' && Number(home) === Number(away);
  const isKnockout = match.stage !== 'group';

  return (
    <div className="border-t border-line first:border-t-0 pt-2 first:pt-0 space-y-2">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <span className="text-gray-400 w-8">#{match.id}</span>
        <span className="flex-1 truncate">
          {match.home_team} vs {match.away_team}
        </span>
        <input value={home} onChange={(e) => setHome(e.target.value)} className="input-score" />
        <span className="text-gray-500">–</span>
        <input value={away} onChange={(e) => setAway(e.target.value)} className="input-score" />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-ink border border-line rounded px-2 py-1"
        >
          <option value="SCHEDULED">SCHEDULED</option>
          <option value="LIVE">LIVE</option>
          <option value="FINISHED">FINISHED</option>
        </select>
        {isKnockout && isDraw && (
          <select
            value={adv}
            onChange={(e) => setAdv(e.target.value)}
            className="bg-ink border border-line rounded px-2 py-1"
          >
            <option value="">¿avanza?</option>
            <option value={match.home_team}>{match.home_team}</option>
            <option value={match.away_team}>{match.away_team}</option>
          </select>
        )}
        <button
          disabled={busy}
          onClick={() =>
            onSave({
              home_score: home === '' ? null : Number(home),
              away_score: away === '' ? null : Number(away),
              advances_team: isKnockout && isDraw && adv ? adv : null,
              status
            })
          }
          className="btn-primary text-xs px-3 py-1"
        >
          {busy ? '…' : 'Guardar'}
        </button>
        <button
          onClick={() => setEditOpen((v) => !v)}
          className="text-gray-400 hover:text-accent text-sm"
          title="Editar equipos / hora"
          aria-label="Editar metadatos del partido"
        >
          ✏️
        </button>
      </div>

      {editOpen && (
        <div className="bg-ink/60 border border-line rounded-lg p-3 space-y-2 text-sm">
          <p className="text-xs text-gray-400">Editar equipos y hora del partido</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs text-gray-500">Local</span>
              <input
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="w-full px-2 py-1.5 bg-ink border border-line rounded focus:outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Visitante</span>
              <input
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="w-full px-2 py-1.5 bg-ink border border-line rounded focus:outline-none focus:border-accent"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-gray-500">Kickoff (hora Costa Rica, UTC-6)</span>
            <input
              type="datetime-local"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
              className="w-full px-2 py-1.5 bg-ink border border-line rounded focus:outline-none focus:border-accent"
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => {
                setHomeTeam(match.home_team);
                setAwayTeam(match.away_team);
                setKickoff(isoToCrDatetimeLocal(match.kickoff_utc));
                setEditOpen(false);
              }}
              className="btn-ghost text-xs"
            >
              Cancelar
            </button>
            <button
              disabled={busyMeta}
              onClick={() =>
                onSaveMeta({
                  home_team: homeTeam,
                  away_team: awayTeam,
                  kickoff_utc: crDatetimeLocalToIso(kickoff)
                })
              }
              className="btn-primary text-xs"
            >
              {busyMeta ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
