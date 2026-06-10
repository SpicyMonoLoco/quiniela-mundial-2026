-- =============================================================
--  MIGRACIÓN 02 — Premios individuales del Mundial
--  Pega TODO este archivo en Supabase → SQL Editor → Run.
--  Es seguro correrlo varias veces.
-- =============================================================

-- 4 premios individuales:
--   top_scorer   = Bota de Oro (máximo goleador)
--   top_assists  = Máximo asistidor
--   best_keeper  = Guante de Oro (mejor portero)
--   best_player  = Balón de Oro (mejor jugador del torneo)
--
-- Lock times:
--   top_scorer + top_assists  → mismo lock que la fase de grupos
--   best_keeper + best_player → 2h antes del primer match de semis

-- --------- Picks de los usuarios ---------
create table if not exists public.special_picks (
  user_id     uuid not null references auth.users(id) on delete cascade,
  award       text not null check (award in ('top_scorer','top_assists','best_keeper','best_player')),
  player_name text not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, award)
);

create index if not exists special_picks_user_idx on public.special_picks(user_id);

alter table public.special_picks enable row level security;

drop policy if exists "special_picks_select_own" on public.special_picks;
create policy "special_picks_select_own" on public.special_picks
  for select using (auth.uid() = user_id);

drop policy if exists "special_picks_insert_own" on public.special_picks;
create policy "special_picks_insert_own" on public.special_picks
  for insert with check (auth.uid() = user_id);

drop policy if exists "special_picks_update_own" on public.special_picks;
create policy "special_picks_update_own" on public.special_picks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "special_picks_delete_own" on public.special_picks;
create policy "special_picks_delete_own" on public.special_picks
  for delete using (auth.uid() = user_id);

-- --------- Ganadores reales (admin los llena) ---------
create table if not exists public.tournament_awards (
  award       text primary key check (award in ('top_scorer','top_assists','best_keeper','best_player')),
  player_name text,
  updated_at  timestamptz not null default now()
);

alter table public.tournament_awards enable row level security;

drop policy if exists "tournament_awards_select_all" on public.tournament_awards;
create policy "tournament_awards_select_all" on public.tournament_awards
  for select using (true);

-- Pre-cargar las 4 filas vacías
insert into public.tournament_awards (award, player_name) values
  ('top_scorer',   null),
  ('top_assists',  null),
  ('best_keeper',  null),
  ('best_player',  null)
on conflict (award) do nothing;

-- --------- Config: pts_award + semi_lock_utc ---------
alter table public.pool_config
  add column if not exists pts_award      int          not null default 2,
  add column if not exists semi_lock_utc  timestamptz;

-- SF1 kickoff: 2026-07-14 19:00 UTC (Dallas 14:00 CDT). 2h antes = 17:00 UTC.
update public.pool_config
  set semi_lock_utc = '2026-07-14T17:00:00Z'
  where id = 1 and semi_lock_utc is null;

-- =============================================================
--  Función: ¿está bloqueado un award?
-- =============================================================
create or replace function public.special_pick_locked(p_award text)
returns boolean
language plpgsql stable as $$
declare
  v_cfg public.pool_config;
begin
  select * into v_cfg from public.pool_config where id = 1;
  if p_award in ('top_scorer','top_assists') then
    return now() >= v_cfg.group_lock_utc;
  elsif p_award in ('best_keeper','best_player') then
    return now() >= v_cfg.semi_lock_utc;
  end if;
  return false;
end;
$$;

-- =============================================================
--  Leaderboard recalculado: incluye puntos de premios
-- =============================================================
-- Las funciones cambian de tipo de retorno (agregamos columnas), hay que dropearlas primero
drop function if exists public.get_leaderboard();
drop function if exists public.get_player_summary(uuid);

create or replace view public.leaderboard as
with match_pts as (
  select
    p.id                                                       as user_id,
    p.display_name,
    coalesce(sum(public.score_pick(
      pk.home_score, pk.away_score, pk.advances_team,
      m.home_score,  m.away_score,  m.advances_team,
      m.stage, cfg.pts_exact, cfg.pts_result
    )), 0)::int                                                as match_points,
    count(*) filter (
      where m.status = 'FINISHED'
        and pk.home_score = m.home_score
        and pk.away_score = m.away_score
    )::int                                                     as exact_count,
    count(*) filter (where m.status = 'FINISHED')::int         as graded_count,
    count(pk.match_id)::int                                    as total_picks
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
    end), 0)::int as award_points,
    count(*) filter (
      where ta.player_name is not null
        and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
    )::int as award_correct
  from public.profiles p
  left join public.special_picks sp on sp.user_id = p.id
  left join public.tournament_awards ta on ta.award = sp.award
  cross join public.pool_config cfg
  group by p.id
)
select
  mp.user_id,
  mp.display_name,
  (mp.match_points + coalesce(ap.award_points, 0))::int   as total_points,
  mp.exact_count,
  mp.graded_count,
  mp.total_picks,
  mp.match_points::int                                     as match_points,
  coalesce(ap.award_points, 0)::int                        as award_points,
  coalesce(ap.award_correct, 0)::int                       as award_correct
from match_pts mp
left join award_pts ap on ap.user_id = mp.user_id
order by total_points desc, mp.exact_count desc, mp.display_name asc;

grant select on public.leaderboard to anon, authenticated;

-- =============================================================
--  RPC: get_leaderboard (devuelve también los puntos de premios)
-- =============================================================
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

-- =============================================================
--  RPC: get_player_summary (también suma puntos de premios)
-- =============================================================
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
  with match_part as (
    select
      count(pk.match_id)::int                                            as total_picks,
      count(*) filter (
        where m.status = 'FINISHED'
          and pk.home_score = m.home_score
          and pk.away_score = m.away_score
      )::int                                                             as exact_picks,
      0::int                                                             as result_picks,
      count(*) filter (where m.status = 'FINISHED')::int                 as graded_matches,
      coalesce(sum(public.score_pick(
        pk.home_score, pk.away_score, pk.advances_team,
        m.home_score,  m.away_score,  m.advances_team,
        m.stage, cfg.pts_exact, cfg.pts_result
      )), 0)::int                                                        as match_points
    from public.picks pk
    join public.matches m on m.id = pk.match_id
    cross join public.pool_config cfg
    where pk.user_id = p_user_id
  ),
  award_part as (
    select
      coalesce(sum(case
        when ta.player_name is not null
         and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
        then cfg.pts_award else 0
      end), 0)::int as award_points,
      count(*) filter (
        where ta.player_name is not null
          and lower(trim(sp.player_name)) = lower(trim(ta.player_name))
      )::int as award_correct
    from public.special_picks sp
    join public.tournament_awards ta on ta.award = sp.award
    cross join public.pool_config cfg
    where sp.user_id = p_user_id
  )
  select
    mp.total_picks,
    mp.exact_picks,
    mp.result_picks,
    mp.graded_matches,
    (mp.match_points + ap.award_points)::int                              as points,
    (select display_name from public.profiles where id = p_user_id)       as display_name,
    mp.match_points,
    ap.award_points,
    ap.award_correct
  from match_part mp cross join award_part ap;
end;
$$;

grant execute on function public.get_player_summary(uuid) to authenticated;
