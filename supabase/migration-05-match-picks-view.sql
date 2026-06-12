-- =============================================================
--  MIGRACIÓN 05 — Vista "Picks por partido"
--  Pega TODO este archivo en Supabase → SQL Editor → Run.
-- =============================================================
-- Devuelve TODOS los picks de TODOS los usuarios para los matches
-- cuya ronda ya está bloqueada. Respeta el lock por etapa (no expone
-- picks de rondas que aún están en edición).

drop function if exists public.get_all_match_picks();

create or replace function public.get_all_match_picks()
returns table (
  match_id       int,
  user_id        uuid,
  display_name   text,
  home_score     int,
  away_score     int,
  advances_team  text,
  points         int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'no_auth';
  end if;

  return query
  select
    pk.match_id,
    pk.user_id,
    p.display_name,
    pk.home_score,
    pk.away_score,
    pk.advances_team,
    public.score_pick(
      pk.home_score, pk.away_score, pk.advances_team,
      m.home_score,  m.away_score,  m.advances_team,
      m.stage, cfg.pts_exact, cfg.pts_result
    )::int as points
  from public.picks pk
  join public.matches m on m.id = pk.match_id
  join public.profiles p on p.id = pk.user_id
  cross join public.pool_config cfg
  where public.match_pick_locked(pk.match_id) = true;
end;
$$;

grant execute on function public.get_all_match_picks() to authenticated;
