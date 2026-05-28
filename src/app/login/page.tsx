'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function withEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
        setError('Revisa tu email para confirmar la cuenta.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        router.push('/picks');
        router.refresh();
      }
    }
    setLoading(false);
  }

  return (
    <div className="max-w-sm mx-auto card p-6 mt-8">
      <h1 className="text-xl font-bold mb-1">
        {mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
      </h1>
      <p className="text-gray-400 text-sm mb-6">Para hacer tus picks de la quiniela</p>

      <button onClick={withGoogle} disabled={loading} className="btn-ghost w-full mb-4">
        <span className="mr-2">🔐</span> Continuar con Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-line" />
        <span className="text-xs text-gray-500">o con email</span>
        <div className="flex-1 h-px bg-line" />
      </div>

      <form onSubmit={withEmail} className="space-y-3">
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
        <input
          type="password"
          placeholder="contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-3 py-2 bg-ink border border-line rounded-lg focus:outline-none focus:border-accent"
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? '...' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-lose">{error}</p>}

      <button
        onClick={() => {
          setMode(mode === 'signin' ? 'signup' : 'signin');
          setError(null);
        }}
        className="mt-4 w-full text-sm text-gray-400 hover:text-accent"
      >
        {mode === 'signin' ? '¿Primera vez? Crear cuenta' : 'Ya tengo cuenta, entrar'}
      </button>
    </div>
  );
}
