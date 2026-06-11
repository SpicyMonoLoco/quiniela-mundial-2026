-- =============================================================
--  MIGRACIÓN 04 — Fix: aciertos exactos no se contaban si match
--  no estaba marcado como FINISHED.
-- =============================================================
-- score_pick() da puntos en cuanto home_score y away_score no son NULL.
-- Pero la vista leaderboard requiere status='FINISHED' para contar exactos.
-- Resultado: si admin entra resultado pero deja status=SCHEDULED/LIVE,
-- los puntos se acumulan pero "Aciertos exactos" queda en 0.
--
-- Fix: la vista debe contar exactos con la misma condición que da puntos
-- (home_score y away_score no-NULL).

drop view if exists public.leaderboard cascade;

create or replace view public.leaderboard as
with match_pts as (
  select
    p.id                                                                  as user_id,
    p.display_name,
    coalesce(sum(public.score_pick(
      pk.home_score, pk.away_score, pk.advances_team,
      m.home_score,  m.away_score,  m.advances_team,
      m.stage, cfg.pts_exact, cfg.pts_result
    )), 0)::int                                                           as match_points,
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
),
award_pts as (
  select
    p.id as user_id,
    coalesce(sum(case
      when ta.player_name is not null
       and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
      then cfg.pts_award else 0
    end), 0)::int                                                         as award_points,
    count(*) filter (
      where ta.player_name is not null
        and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
    )::int                                                                as award_correct
  from public.profiles p
  left join public.special_picks sp on sp.user_id = p.id
  left join public.tournament_awards ta on ta.award = sp.award
  cross join public.pool_config cfg
  group by p.id
)
select
  mp.user_id,
  mp.display_name,
  (mp.match_points + coalesce(ap.award_points, 0))::int                   as total_points,
  mp.exact_count,
  mp.graded_count,
  mp.total_picks,
  mp.match_points::int                                                    as match_points,
  coalesce(ap.award_points, 0)::int                                       as award_points,
  coalesce(ap.award_correct, 0)::int                                      as award_correct
from match_pts mp
left join award_pts ap on ap.user_id = mp.user_id
order by total_points desc, mp.exact_count desc, mp.display_name asc;

grant select on public.leaderboard to anon, authenticated;

-- Re-crear la función que usaba la vista (cascade la dropeó)
drop function if exists public.get_leaderboard();
create or replace function public.get_leaderboard()
returns table (
  user_id       uuid,
  display_name  text,
  total_points  int,
  exact_count   int,
  graded_count  int,
  total_picks   int,
  match_points  int,
  award_points  int,
  award_correct int,
  rank          int
)
language sql stable security definer set search_path = public as $$
  select
    user_id, display_name, total_points, exact_count, graded_count, total_picks,
    match_points, award_points, award_correct,
    (rank() over (order by total_points desc, exact_count desc, display_name asc))::int
  from public.leaderboard;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;
