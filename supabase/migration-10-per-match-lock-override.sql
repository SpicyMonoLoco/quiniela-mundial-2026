-- =============================================================
--  MIGRACIÓN 10 — Override del lock por partido individual
-- =============================================================
-- Permite que un partido específico tenga un lock distinto al
-- default (1h antes para knockout, group_lock_utc para grupos).
-- Útil cuando un amigo no metió un pick y quieres extender un par
-- de minutos sin afectar al resto.

alter table public.matches
  add column if not exists pick_lock_utc timestamptz;

create or replace function public.match_pick_locked(p_match_id int)
returns boolean
language plpgsql stable as $$
declare
  v_stage text;
  v_kickoff timestamptz;
  v_override timestamptz;
  v_match_lock_hours int;
begin
  select stage, kickoff_utc, pick_lock_utc
    into v_stage, v_kickoff, v_override
    from public.matches where id = p_match_id;
  if v_stage is null then return false; end if;

  -- Override per-match (admin lo seteó manualmente)
  if v_override is not null then
    return now() >= v_override;
  end if;

  -- Default: grupos → group_lock_utc
  if v_stage = 'group' then
    return now() >= (select group_lock_utc from public.pool_config where id = 1);
  end if;

  -- Default: knockout → kickoff - match_lock_hours
  select match_lock_hours into v_match_lock_hours from public.pool_config where id = 1;
  return now() >= (v_kickoff - make_interval(hours => v_match_lock_hours));
end;
$$;
