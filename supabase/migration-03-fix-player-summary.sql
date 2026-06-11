-- =============================================================
--  MIGRACIÓN 03 — Fix: get_player_summary siempre devuelve 1 fila
--  Pega TODO este archivo en Supabase → SQL Editor → Run.
-- =============================================================
--
-- Problema: la versión de migration-02 retornaba 0 filas si el jugador
-- no tenía ningún pick. Eso causaba que /jugador/[id] mostrara
-- "Jugador no encontrado o sin actividad" incluso para usuarios válidos
-- que aún no habían llenado nada.
--
-- Fix: arrancar de `profiles` y left join con picks/special_picks, así
-- siempre devolvemos una fila por jugador (con ceros si no hay actividad).

drop function if exists public.get_player_summary(uuid);

create or replace function public.get_player_summary(p_user_id uuid)
returns table (
  total_picks    int,
  exact_picks    int,
  result_picks   int,
  graded_matches int,
  points         int,
  display_name   text,
  match_points   int,
  award_points   int,
  award_correct  int
)
language plpgsql stable security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'no_auth';
  end if;

  return query
  select
    coalesce(mp.total_picks, 0)::int                                                 as total_picks,
    coalesce(mp.exact_picks, 0)::int                                                 as exact_picks,
    0::int                                                                            as result_picks,
    coalesce(mp.graded_matches, 0)::int                                              as graded_matches,
    (coalesce(mp.match_points, 0) + coalesce(ap.award_points, 0))::int               as points,
    p.display_name,
    coalesce(mp.match_points, 0)::int                                                as match_points,
    coalesce(ap.award_points, 0)::int                                                as award_points,
    coalesce(ap.award_correct, 0)::int                                               as award_correct
  from public.profiles p
  left join (
    select
      pk.user_id,
      count(pk.match_id)::int                                                        as total_picks,
      count(*) filter (
        where m.status = 'FINISHED'
          and pk.home_score = m.home_score
          and pk.away_score = m.away_score
      )::int                                                                         as exact_picks,
      count(*) filter (where m.status = 'FINISHED')::int                             as graded_matches,
      coalesce(sum(public.score_pick(
        pk.home_score, pk.away_score, pk.advances_team,
        m.home_score,  m.away_score,  m.advances_team,
        m.stage, cfg.pts_exact, cfg.pts_result
      )), 0)::int                                                                    as match_points
    from public.picks pk
    join public.matches m on m.id = pk.match_id
    cross join public.pool_config cfg
    where pk.user_id = p_user_id
    group by pk.user_id
  ) mp on mp.user_id = p.id
  left join (
    select
      sp.user_id,
      coalesce(sum(case
        when ta.player_name is not null
         and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
        then cfg.pts_award else 0
      end), 0)::int                                                                  as award_points,
      count(*) filter (
        where ta.player_name is not null
          and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
      )::int                                                                         as award_correct
    from public.special_picks sp
    join public.tournament_awards ta on ta.award = sp.award
    cross join public.pool_config cfg
    where sp.user_id = p_user_id
    group by sp.user_id
  ) ap on ap.user_id = p.id
  where p.id = p_user_id;
end;
$$;

grant execute on function public.get_player_summary(uuid) to authenticated;
