import './globals.css';
import type { Metadata, Viewport } from 'next';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_POOL_NAME ?? 'PDP · Quiniela Mundial 2026',
  description: 'PDP · Predice los resultados del Mundial 2026 con la banda',
  manifest: '/manifest.json'
};

export const viewport: Viewport = {
  themeColor: '#0b0f17',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen">
        <NavBar />
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
