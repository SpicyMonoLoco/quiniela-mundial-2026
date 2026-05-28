'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function NavBar() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();
      if (adminEmail && data.user?.email?.toLowerCase() === adminEmail) {
        setIsAdmin(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const links = [
    { href: '/', label: 'Ranking' },
    { href: '/picks', label: 'Mis picks' },
    { href: '/grupos', label: 'Grupos' },
    { href: '/historico', label: 'Histórico' }
  ];
  if (isAdmin) links.push({ href: '/admin', label: 'Admin' });

  return (
    <header className="border-b border-line bg-ink/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex items-center justify-center h-8 px-2 rounded-md bg-gradient-to-br from-accent to-gold text-ink font-extrabold tracking-wider text-sm shadow-sm">
            PDP
          </span>
          <span className="hidden sm:inline text-sm text-gray-300 group-hover:text-accent transition">
            Mundial 2026
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {email ? (
            links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 text-sm rounded-lg ${
                  path === l.href ? 'bg-line text-accent' : 'text-gray-300 hover:bg-line'
                }`}
              >
                {l.label}
              </Link>
            ))
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              Entrar
            </Link>
          )}
          {email && (
            <button onClick={signOut} className="ml-1 px-2 py-1 text-xs text-gray-400 hover:text-white">
              Salir
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
