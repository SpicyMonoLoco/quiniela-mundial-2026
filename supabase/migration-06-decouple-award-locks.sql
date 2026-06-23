-- =============================================================
--  MIGRACIÓN 06 — Separar el lock de los premios del lock de grupos
-- =============================================================
-- Antes: top_scorer/top_assists usaban group_lock_utc. Eso significaba
-- que reabrir los premios también reabría los picks de partidos.
-- Ahora: usan su propio awards_top_lock_utc, independiente.
--
-- Default = el valor actual de group_lock_utc (para no cambiar el
-- comportamiento al correr esta migración).

alter table public.pool_config
  add column if not exists awards_top_lock_utc timestamptz;

update public.pool_config
  set awards_top_lock_utc = group_lock_utc
  where id = 1 and awards_top_lock_utc is null;

-- Actualizamos la función para que top_scorer/top_assists usen
-- awards_top_lock_utc en vez de group_lock_utc.
create or replace function public.special_pick_locked(p_award text)
returns boolean
language plpgsql stable as $$
declare
  v_cfg public.pool_config;
begin
  select * into v_cfg from public.pool_config where id = 1;
  if p_award in ('top_scorer','top_assists') then
    return now() >= v_cfg.awards_top_lock_utc;
  elsif p_award in ('best_keeper','best_player') then
    return now() >= v_cfg.semi_lock_utc;
  end if;
  return false;
end;
$$;
