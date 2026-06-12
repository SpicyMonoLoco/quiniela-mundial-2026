'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function NavBar() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Cerrar el menú al cambiar de ruta
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const links = [
    { href: '/', label: 'Ranking' },
    { href: '/picks', label: 'Mis picks' },
    { href: '/resultados', label: 'Picks de todos' },
    { href: '/grupos', label: 'Grupos' },
    { href: '/historico', label: 'Histórico' },
    { href: '/reglas', label: 'Reglas' },
    { href: '/admin', label: 'Admin' }
  ];

  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl lg:max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <span className="inline-flex items-center justify-center h-8 px-2 rounded-md bg-gradient-to-br from-accent to-gold text-ink font-extrabold tracking-wider text-sm shadow-sm">
            PDP
          </span>
          <span className="hidden sm:inline text-sm text-gray-300 group-hover:text-accent transition">
            Mundial 2026
          </span>
        </Link>

        {/* Nav inline en desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {email ? (
            <>
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    path === l.href ? 'bg-line text-accent' : 'text-gray-300 hover:bg-line'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <button onClick={signOut} className="ml-1 px-2 py-1 text-xs text-gray-400 hover:text-white">
                Salir
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Entrar
            </Link>
          )}
        </nav>

        {/* Botón hamburguesa en móvil */}
        <div className="md:hidden flex items-center gap-2">
          {email ? (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menú"
              aria-expanded={menuOpen}
              className="p-2 rounded-lg hover:bg-line text-gray-200"
            >
              {menuOpen ? (
                // X
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                // hamburger
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* Dropdown móvil */}
      {menuOpen && email && (
        <div className="md:hidden border-t border-line bg-ink">
          <nav className="max-w-3xl lg:max-w-5xl mx-auto px-4 py-2 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`py-3 px-2 rounded-lg text-sm ${
                  path === l.href ? 'bg-line text-accent' : 'text-gray-200 hover:bg-line'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="text-left py-3 px-2 mt-1 border-t border-line text-sm text-gray-400 hover:text-white"
            >
              Salir
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
