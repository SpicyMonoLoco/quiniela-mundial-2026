'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function ResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setReady(true);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo('¡Listo! Contraseña actualizada. Te llevamos a tus picks…');
    setTimeout(() => {
      router.push('/picks');
      router.refresh();
    }, 1500);
  }

  if (!ready) {
    return (
      <div className="max-w-sm mx-auto card p-6 mt-8 text-gray-400">Cargando…</div>
    );
  }

  if (!authed) {
    return (
      <div className="max-w-sm mx-auto card p-6 mt-8">
        <h1 className="text-xl font-bold mb-2">Link expirado o inválido</h1>
        <p className="text-gray-400 text-sm mb-4">
          El link de recuperación expira después de un rato. Vuelve a pedir uno desde la pantalla de login.
        </p>
        <button onClick={() => router.push('/login')} className="btn-primary w-full">
          Ir al login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto card p-6 mt-8">
      <h1 className="text-xl font-bold mb-1">Nueva contraseña</h1>
      <p className="text-gray-400 text-sm mb-6">Define una contraseña nueva para tu cuenta.</p>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          placeholder="Nueva contraseña (mín. 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Confirma la contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-lose">{error}</p>}
      {info && <p className="mt-3 text-sm text-accent">{info}</p>}
    </div>
  );
}
