-- =============================================================
--  MIGRACIÓN 01 — Ver picks de otros jugadores
--  Pega TODO este archivo en Supabase → SQL Editor → Run
--  Es seguro correrlo varias veces.
-- =============================================================

-- Devuelve los picks de un jugador, pero SOLO los de matches ya bloqueados.
-- Se ejecuta con privilegios elevados (security definer) y respeta el lock por etapa.
create or replace function public.get_player_picks(p_user_id uuid)
returns table (
  match_id      int,
  home_score    int,
  away_score    int,
  advances_team text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'no_auth';
  end if;

  return query
  select
    pk.match_id,
    pk.home_score,
    pk.away_score,
    pk.advances_team
  from public.picks pk
  where pk.user_id = p_user_id
    and public.match_pick_locked(pk.match_id) = true;
end;
$$;

grant execute on function public.get_player_picks(uuid) to authenticated;

-- Variante: contadores rápidos del jugador (sin revelar los picks)
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
    count(pk.match_id)::int                                            as total_picks,
    count(*) filter (
      where m.status = 'FINISHED'
        and pk.home_score = m.home_score
        and pk.away_score = m.away_score
    )::int                                                             as exact_picks,
    count(*) filter (
      where m.status = 'FINISHED'
        and pk.home_score <> m.home_score or pk.away_score <> m.away_score
        and sign(pk.home_score - pk.away_score) = sign(m.home_score - m.away_score)
    )::int                                                             as result_picks,
    count(*) filter (where m.status = 'FINISHED')::int                 as graded_matches,
    coalesce(sum(public.score_pick(
      pk.home_score, pk.away_score, pk.advances_team,
      m.home_score,  m.away_score,  m.advances_team,
      m.stage, cfg.pts_exact, cfg.pts_result
    )), 0)::int                                                        as points,
    (select display_name from public.profiles where id = p_user_id)    as display_name
  from public.picks pk
  join public.matches m on m.id = pk.match_id
  cross join public.pool_config cfg
  where pk.user_id = p_user_id;
end;
$$;

grant execute on function public.get_player_summary(uuid) to authenticated;

-- Histórico: tabla derivada con puntos acumulados por usuario, por partido finalizado.
-- Se usa para la gráfica /historico.
create or replace function public.get_points_history()
returns table (
  match_id     int,
  kickoff_utc  timestamptz,
  user_id      uuid,
  display_name text,
  delta_points int,
  cum_points   int,
  match_index  int
)
language sql stable security definer set search_path = public as $$
  with finished_matches as (
    select m.*,
           row_number() over (order by m.kickoff_utc, m.id) as idx
    from public.matches m
    where m.status = 'FINISHED'
  ),
  per_match as (
    select
      fm.id          as match_id,
      fm.kickoff_utc,
      fm.idx,
      p.id           as user_id,
      p.display_name,
      coalesce(public.score_pick(
        pk.home_score, pk.away_score, pk.advances_team,
        fm.home_score, fm.away_score, fm.advances_team,
        fm.stage, cfg.pts_exact, cfg.pts_result
      ), 0)::int     as delta_points
    from finished_matches fm
    cross join public.profiles p
    cross join public.pool_config cfg
    left join public.picks pk on pk.user_id = p.id and pk.match_id = fm.id
  )
  select
    match_id,
    kickoff_utc,
    user_id,
    display_name,
    delta_points,
    (sum(delta_points) over (partition by user_id order by idx, match_id rows between unbounded preceding and current row))::int as cum_points,
    idx::int as match_index
  from per_match
  order by idx, display_name;
$$;

grant execute on function public.get_points_history() to authenticated;
