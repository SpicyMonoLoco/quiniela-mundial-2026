-- =============================================================
--  MIGRACIÓN 08 — Lock individual por partido knockout
-- =============================================================
-- Antes: todos los matches de una ronda cerraban a la vez,
--        2h antes del primer partido.
-- Ahora: cada partido knockout cierra 1h antes de SU kickoff.
--        Grupos siguen con group_lock_utc (ya pasó, no cambia).

-- Agregamos columna match_lock_hours (default 1h)
alter table public.pool_config
  add column if not exists match_lock_hours int not null default 1;

create or replace function public.match_pick_locked(p_match_id int)
returns boolean
language plpgsql stable as $$
declare
  v_stage text;
  v_kickoff timestamptz;
  v_match_lock_hours int;
begin
  select stage, kickoff_utc into v_stage, v_kickoff
    from public.matches where id = p_match_id;
  if v_stage is null then return false; end if;

  -- Fase de grupos: usa el lock global de grupos
  if v_stage = 'group' then
    return now() >= (select group_lock_utc from public.pool_config where id = 1);
  end if;

  -- Knockout: 1h antes del kickoff de ESE match específico
  select match_lock_hours into v_match_lock_hours from public.pool_config where id = 1;
  return now() >= (v_kickoff - make_interval(hours => v_match_lock_hours));
end;
$$;
