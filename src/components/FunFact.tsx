'use client';

import { useEffect, useState } from 'react';
import { WORLD_CUP_FACTS } from '@/lib/world-cup-facts';

export function FunFact() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * WORLD_CUP_FACTS.length));
  }, []);

  function nextFact() {
    setIndex((prev) => {
      // Evita repetir el mismo dato dos veces seguidas
      let next = Math.floor(Math.random() * WORLD_CUP_FACTS.length);
      if (prev !== null && WORLD_CUP_FACTS.length > 1) {
        while (next === prev) next = Math.floor(Math.random() * WORLD_CUP_FACTS.length);
      }
      return next;
    });
  }

  return (
    <section className="card p-5 relative overflow-hidden">
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-tr from-gold/15 to-accent/10 blur-3xl pointer-events-none" />
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2 className="font-semibold flex items-center gap-2">
          <span>⚽</span> Dato mundialista de Dani
        </h2>
        <button
          onClick={nextFact}
          className="text-xs text-accent hover:underline whitespace-nowrap"
          aria-label="Mostrar otro dato curioso"
        >
          Otro dato →
        </button>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed min-h-[3rem]">
        {index === null ? (
          <span className="text-gray-500">Cargando dato curioso…</span>
        ) : (
          WORLD_CUP_FACTS[index]
        )}
      </p>
    </section>
  );
}
