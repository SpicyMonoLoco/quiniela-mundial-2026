'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

type Mode = 'signin' | 'signup' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function withGoogle() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name || email.split('@')[0] } }
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo('Revisa tu email para confirmar la cuenta.');
      }
    } else if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/picks');
        router.refresh();
      }
    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/login/reset`
      });
      if (error) {
        setError(error.message);
      } else {
        setInfo('Te mandamos un email con un link para resetear tu contraseña. Revisa tu inbox y spam.');
      }
    }
    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
  }

  const titles: Record<Mode, string> = {
    signin: 'Entrar',
    signup: 'Crear cuenta',
    forgot: 'Recuperar contraseña'
  };

  const subtitles: Record<Mode, string> = {
    signin: 'Para hacer tus picks de la quiniela',
    signup: 'Únete a la quiniela PDP',
    forgot: 'Te mandamos un link al email para que pongas una contraseña nueva'
  };

  return (
    <div className="max-w-sm mx-auto card p-6 mt-8">
      <h1 className="text-xl font-bold mb-1">{titles[mode]}</h1>
      <p className="text-gray-400 text-sm mb-6">{subtitles[mode]}</p>

      {mode !== 'forgot' && (
        <>
          <button onClick={withGoogle} disabled={loading} className="btn-ghost w-full mb-4">
            <span className="mr-2">🔐</span> Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-gray-500">o con email</span>
            <div className="flex-1 h-px bg-line" />
          </div>
        </>
      )}

      <form onSubmit={submitEmail} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Tu nombre (visible en el ranking)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
          />
        )}
        <input
          type="email"
          placeholder="email@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
          />
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading
            ? '...'
            : mode === 'signin'
            ? 'Entrar'
            : mode === 'signup'
            ? 'Crear cuenta'
            : 'Mandar link de reset'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-lose">{error}</p>}
      {info && <p className="mt-3 text-sm text-accent">{info}</p>}

      <div className="mt-5 flex flex-col gap-1 text-center">
        {mode === 'signin' && (
          <>
            <button
              onClick={() => switchMode('signup')}
              className="text-sm text-gray-400 hover:text-accent"
            >
              ¿Primera vez? Crear cuenta
            </button>
            <button
              onClick={() => switchMode('forgot')}
              className="text-xs text-gray-500 hover:text-accent"
            >
              Olvidé mi contraseña
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button
            onClick={() => switchMode('signin')}
            className="text-sm text-gray-400 hover:text-accent"
          >
            Ya tengo cuenta, entrar
          </button>
        )}
        {mode === 'forgot' && (
          <button
            onClick={() => switchMode('signin')}
            className="text-sm text-gray-400 hover:text-accent"
          >
            ← Volver al login
          </button>
        )}
      </div>
    </div>
  );
}
