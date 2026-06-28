-- =============================================================
--  MIGRACIÓN 09 — Nuevo scoring de fase eliminatoria
-- =============================================================
-- Reglas nuevas (votadas por el grupo):
--   1. El marcador aplica para 120 min (regular + extra time).
--      Base: 5 marcador exacto / 3 resultado correcto / 0 falla.
--   2. Si fue a penales y predijiste empate: +1 si acertaste quién avanza.
--   3. Si fue a penales y predijiste no-empate: +1 si el equipo que predijiste
--      ganador fue el que avanzó por penales.
--
-- Cambios:
--   - score_pick agrega params home_team, away_team (necesarios para
--     determinar el advancer implícito cuando el pick es no-empate)
--   - leaderboard, get_player_summary, get_all_match_picks pasan los nuevos
--     params al llamar score_pick

-- 1) Drop dependientes primero (la vista y funciones que usan score_pick),
--    después drop score_pick mismo. Sin este orden Postgres no nos deja
--    cambiar la signature.
drop function if exists public.get_leaderboard();
drop function if exists public.get_all_match_picks();
drop function if exists public.get_player_summary(uuid);
drop view if exists public.leaderboard;
drop function if exists public.score_pick(int, int, text, int, int, text, text, int, int);

create or replace function public.score_pick(
  p_pick_home    int,
  p_pick_away    int,
  p_pick_advances text,
  p_home         int,
  p_away         int,
  p_advances     text,
  p_stage        text,
  p_home_team    text,
  p_away_team    text,
  p_pts_exact    int,
  p_pts_result   int
) returns int
language plpgsql immutable as $$
declare
  v_base int := 0;
  v_extra int := 0;
  v_result_pick text;
  v_result_real text;
  v_pred_advancer text;
begin
  if p_home is null or p_away is null then return 0; end if;

  -- Base: marcador en 120 minutos
  if p_pick_home = p_home and p_pick_away = p_away then
    v_base := p_pts_exact;
  else
    v_result_pick := case
      when p_pick_home > p_pick_away then 'H'
      when p_pick_home < p_pick_away then 'A'
      else 'D'
    end;
    v_result_real := case
      when p_home > p_away then 'H'
      when p_home < p_away then 'A'
      else 'D'
    end;
    if v_result_pick = v_result_real then
      v_base := p_pts_result;
    end if;
  end if;

  -- Extra +1: solo knockout que fue a penales (advances_team del match no NULL)
  if p_stage <> 'group' and p_advances is not null then
    -- Determinar quién predijo el usuario como avanzador
    if p_pick_home = p_pick_away then
      -- Pick de empate: usa la columna explícita
      v_pred_advancer := p_pick_advances;
    elsif p_pick_home > p_pick_away then
      -- Pick de no-empate: el ganador predicho es el equipo local
      v_pred_advancer := p_home_team;
    else
      v_pred_advancer := p_away_team;
    end if;

    if v_pred_advancer is not null
       and lower(trim(v_pred_advancer)) = lower(trim(p_advances)) then
      v_extra := 1;
    end if;
  end if;

  return v_base + v_extra;
end;
$$;

-- 2) Recrear vista leaderboard (pasa home_team/away_team)
drop function if exists public.get_leaderboard();
drop view if exists public.leaderboard;

create or replace view public.leaderboard as
select
  p.id                                                                  as user_id,
  p.display_name,
  coalesce(sum(public.score_pick(
    pk.home_score, pk.away_score, pk.advances_team,
    m.home_score,  m.away_score,  m.advances_team,
    m.stage, m.home_team, m.away_team,
    cfg.pts_exact, cfg.pts_result
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

-- 3) Recrear get_player_summary
drop function if exists public.get_player_summary(uuid);

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
        m.stage, m.home_team, m.away_team,
        cfg.pts_exact, cfg.pts_result
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

-- 4) Recrear get_all_match_picks
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
      m.stage, m.home_team, m.away_team,
      cfg.pts_exact, cfg.pts_result
    )::int as points
  from public.picks pk
  join public.matches m on m.id = pk.match_id
  join public.profiles p on p.id = pk.user_id
  cross join public.pool_config cfg
  where public.match_pick_locked(pk.match_id) = true;
end;
$$;

grant execute on function public.get_all_match_picks() to authenticated;
