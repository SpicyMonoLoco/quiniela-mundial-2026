-- =============================================================
--  MIGRACIÓN 07 — Eliminar el sistema de premios individuales
-- =============================================================
-- El grupo votó eliminar los premios. Limpiamos:
--   - tabla special_picks (picks de los jugadores)
--   - tabla tournament_awards (ganadores reales)
--   - columnas pts_award, semi_lock_utc, awards_top_lock_utc de pool_config
--   - función special_pick_locked
--   - leaderboard view y get_leaderboard sin award_points
--   - get_player_summary sin award_points
--
-- Es seguro correr esto varias veces (idempotente).

-- 1) Drop la vista y funciones que dependen de las tablas
drop function if exists public.get_leaderboard();
drop view if exists public.leaderboard;
drop function if exists public.get_player_summary(uuid);
drop function if exists public.special_pick_locked(text);

-- 2) Drop tablas de premios
drop table if exists public.special_picks;
drop table if exists public.tournament_awards;

-- 3) Drop columnas de pool_config
alter table public.pool_config
  drop column if exists pts_award,
  drop column if exists semi_lock_utc,
  drop column if exists awards_top_lock_utc;

-- 4) Recrear leaderboard view sin awards
create or replace view public.leaderboard as
select
  p.id                                                                  as user_id,
  p.display_name,
  coalesce(sum(public.score_pick(
    pk.home_score, pk.away_score, pk.advances_team,
    m.home_score,  m.away_score,  m.advances_team,
    m.stage, cfg.pts_exact, cfg.pts_result
  )), 0)::int                                                           as total_points,
  count(*) filter (
    where m.home_score is not null and m.away_score is not null
      and pk.home_score = m.home_score
      and pk.away_score = m.away_score
  )::int                                                                as exact_count,
  count(*) filter (
    where m.home_score is not null and m.away_score is not null
  )::int                                                                as graded_count,
  count(pk.match_id)::int                                               as total_picks
from public.profiles p
left join public.picks pk on pk.user_id = p.id
left join public.matches m on m.id = pk.match_id
cross join public.pool_config cfg
group by p.id, p.display_name
order by total_points desc, exact_count desc, p.display_name asc;

grant select on public.leaderboard to anon, authenticated;

-- 5) Recrear get_leaderboard()
create or replace function public.get_leaderboard()
returns table (
  user_id       uuid,
  display_name  text,
  total_points  int,
  exact_count   int,
  graded_count  int,
  total_picks   int,
  rank          int
)
language sql stable security definer set search_path = public as $$
  select
    user_id, display_name, total_points, exact_count, graded_count, total_picks,
    (rank() over (order by total_points desc, exact_count desc, display_name asc))::int
  from public.leaderboard;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;

-- 6) Recrear get_player_summary()
create or replace function public.get_player_summary(p_user_id uuid)
returns table (
  total_picks    int,
  exact_picks    int,
  result_picks   int,
  graded_matches int,
  points         int,
  display_name   text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'no_auth';
  end if;

  return query
  select
    coalesce(mp.total_picks, 0)::int        as total_picks,
    coalesce(mp.exact_picks, 0)::int        as exact_picks,
    0::int                                   as result_picks,
    coalesce(mp.graded_matches, 0)::int     as graded_matches,
    coalesce(mp.match_points, 0)::int       as points,
    p.display_name
  from public.profiles p
  left join (
    select
      pk.user_id,
      count(pk.match_id)::int as total_picks,
      count(*) filter (
        where m.home_score is not null and m.away_score is not null
          and pk.home_score = m.home_score
          and pk.away_score = m.away_score
      )::int as exact_picks,
      count(*) filter (
        where m.home_score is not null and m.away_score is not null
      )::int as graded_matches,
      coalesce(sum(public.score_pick(
        pk.home_score, pk.away_score, pk.advances_team,
        m.home_score,  m.away_score,  m.advances_team,
        m.stage, cfg.pts_exact, cfg.pts_result
      )), 0)::int as match_points
    from public.picks pk
    join public.matches m on m.id = pk.match_id
    cross join public.pool_config cfg
    where pk.user_id = p_user_id
    group by pk.user_id
  ) mp on mp.user_id = p.id
  where p.id = p_user_id;
end;
$$;

grant execute on function public.get_player_summary(uuid) to authenticated;
