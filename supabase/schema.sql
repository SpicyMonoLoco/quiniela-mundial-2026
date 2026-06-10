-- =============================================================
--  QUINIELA MUNDIAL 2026 — Esquema de base de datos
--  Pega TODO este archivo en Supabase → SQL Editor → Run
-- =============================================================

-- --------- Perfiles de usuario ---------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email        text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------- Partidos ---------
-- stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'tp' | 'final'
create table if not exists public.matches (
  id            int primary key,
  stage         text not null default 'group',
  group_letter  char(1),
  matchday      int,
  kickoff_utc   timestamptz not null,
  venue         text,
  city          text,
  country       text,
  home_team     text not null,
  away_team     text not null,
  home_score    int,
  away_score    int,
  -- Para empates en fase eliminatoria: qué equipo avanza por penales
  advances_team text,
  status        text not null default 'SCHEDULED', -- SCHEDULED | LIVE | FINISHED
  external_id   text,                              -- id de football-data.org
  updated_at    timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on public.matches(kickoff_utc);
create index if not exists matches_stage_idx on public.matches(stage);

-- --------- Picks (predicciones de los usuarios) ---------
create table if not exists public.picks (
  user_id       uuid not null references auth.users(id) on delete cascade,
  match_id      int  not null references public.matches(id) on delete cascade,
  home_score    int  not null,
  away_score    int  not null,
  -- Solo para knockout cuando home_score = away_score
  advances_team text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, match_id)
);

create index if not exists picks_user_idx on public.picks(user_id);

-- --------- Configuración global de la quiniela ---------
create table if not exists public.pool_config (
  id                       int primary key default 1,
  group_lock_utc           timestamptz not null, -- 12h antes del primer kickoff Jun 11
  pool_name                text not null default 'Quiniela Mundial 2026',
  pts_exact                int  not null default 5,
  pts_result               int  not null default 3,
  knockout_lock_hours      int  not null default 2,
  constraint pool_config_singleton check (id = 1)
);

insert into public.pool_config (id, group_lock_utc, pool_name)
values (1, '2026-06-11T18:00:00Z', 'Quiniela PDP — Mundial 2026')
on conflict (id) do nothing;
-- Opener: 2026-06-11 13:00 CR/CDMX (UTC-6) = 19:00 UTC. 1h antes = 18:00 UTC = 12:00 CR.

-- =============================================================
--  ROW LEVEL SECURITY
-- =============================================================
alter table public.profiles      enable row level security;
alter table public.matches       enable row level security;
alter table public.picks         enable row level security;
alter table public.pool_config   enable row level security;

-- profiles: cualquier usuario logueado lee todos los nombres (para el ranking)
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- matches: lectura pública
drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all" on public.matches
  for select using (true);

-- picks: cada usuario solo lee/escribe los suyos. El ranking se calcula por RPC.
drop policy if exists "picks_select_own" on public.picks;
create policy "picks_select_own" on public.picks
  for select using (auth.uid() = user_id);

drop policy if exists "picks_insert_own" on public.picks;
create policy "picks_insert_own" on public.picks
  for insert with check (auth.uid() = user_id);

drop policy if exists "picks_update_own" on public.picks;
create policy "picks_update_own" on public.picks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- pool_config: lectura pública
drop policy if exists "pool_config_select_all" on public.pool_config;
create policy "pool_config_select_all" on public.pool_config
  for select using (true);

-- =============================================================
--  FUNCIONES DE LÓGICA DE NEGOCIO
-- =============================================================

-- Calcula los puntos para un pick dado un resultado
create or replace function public.score_pick(
  p_pick_home int, p_pick_away int,
  p_pick_advances text,
  p_home int, p_away int,
  p_advances text,
  p_stage text,
  p_pts_exact int, p_pts_result int
) returns int
language plpgsql immutable as $$
declare
  v_result_pick text;
  v_result_real text;
begin
  if p_home is null or p_away is null then return 0; end if;

  -- Exacto
  if p_pick_home = p_home and p_pick_away = p_away then
    -- En knockout, si fue empate, también necesita acertar quién avanzó por penales
    if p_stage <> 'group' and p_home = p_away then
      if p_pick_advances is not null and p_advances is not null
         and p_pick_advances = p_advances then
        return p_pts_exact;
      else
        return p_pts_result; -- Acertó marcador pero no quién avanza → solo resultado
      end if;
    end if;
    return p_pts_exact;
  end if;

  -- Resultado correcto
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
    -- En knockout con empate, todavía necesita acertar quién avanza
    if p_stage <> 'group' and v_result_real = 'D' then
      if p_pick_advances is not null and p_advances is not null
         and p_pick_advances = p_advances then
        return p_pts_result;
      else
        return 0;
      end if;
    end if;
    return p_pts_result;
  end if;

  return 0;
end;
$$;

-- Devuelve si los picks de la etapa "group" están cerrados (locked)
create or replace function public.group_picks_locked()
returns boolean
language sql stable as $$
  select now() >= (select group_lock_utc from public.pool_config where id = 1);
$$;

-- Devuelve si los picks de un match knockout están cerrados (2h antes del primer match de su ronda)
create or replace function public.match_pick_locked(p_match_id int)
returns boolean
language plpgsql stable as $$
declare
  v_stage text;
  v_min_kickoff timestamptz;
  v_lock_hours int;
begin
  select stage into v_stage from public.matches where id = p_match_id;
  if v_stage is null then return false; end if;

  if v_stage = 'group' then
    return now() >= (select group_lock_utc from public.pool_config where id = 1);
  end if;

  select knockout_lock_hours into v_lock_hours from public.pool_config where id = 1;
  select min(kickoff_utc) into v_min_kickoff
    from public.matches where stage = v_stage;

  return now() >= (v_min_kickoff - make_interval(hours => v_lock_hours));
end;
$$;

-- Vista del leaderboard
create or replace view public.leaderboard as
select
  p.id                                                       as user_id,
  p.display_name,
  coalesce(sum(public.score_pick(
    pk.home_score, pk.away_score, pk.advances_team,
    m.home_score, m.away_score, m.advances_team,
    m.stage, cfg.pts_exact, cfg.pts_result
  )), 0)::int                                                as total_points,
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
order by total_points desc, exact_count desc, p.display_name asc;

grant select on public.leaderboard to anon, authenticated;

-- Función RPC para que cualquier usuario logueado vea el ranking
create or replace function public.get_leaderboard()
returns table (
  user_id uuid,
  display_name text,
  total_points int,
  exact_count int,
  graded_count int,
  total_picks int,
  rank int
)
language sql stable security definer set search_path = public as $$
  select
    user_id,
    display_name,
    total_points,
    exact_count,
    graded_count,
    total_picks,
    (rank() over (order by total_points desc, exact_count desc, display_name asc))::int
  from public.leaderboard;
$$;

grant execute on function public.get_leaderboard() to anon, authenticated;
