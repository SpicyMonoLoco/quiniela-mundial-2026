'use client';

import Link from 'next/link';

export function NoAdmin() {
  return (
    <div className="max-w-md mx-auto text-center mt-4">
      <div className="card overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/no-admin.jpg"
          alt="Mira ese hocico"
          className="w-full h-auto block"
        />
        <div className="p-6">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Va jalado de aquí.
          </h1>
          <p className="mt-3 text-gray-400 text-sm">
            Esta sección es solo del admin. Solo yo puedo tener acceso.
          </p>
          <p className="mt-2 text-gray-500 text-xs">
            Si crees que es un error, mándame mensaje 😄
          </p>
          <div className="mt-5 flex gap-2 justify-center">
            <Link href="/" className="btn-primary text-sm">
              ← Volver al ranking
            </Link>
            <Link href="/picks" className="btn-ghost text-sm">
              Mis picks
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
