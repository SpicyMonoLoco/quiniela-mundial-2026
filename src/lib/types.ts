export type Match = {
  id: number;
  stage: 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'tp' | 'final';
  group_letter: string | null;
  matchday: number | null;
  kickoff_utc: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  advances_team: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  external_id: string | null;
};

export type Pick = {
  user_id: string;
  match_id: number;
  home_score: number;
  away_score: number;
  advances_team: string | null;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  email: string | null;
  is_admin: boolean;
};

export type LeaderRow = {
  user_id: string;
  display_name: string;
  total_points: number;
  exact_count: number;
  graded_count: number;
  total_picks: number;
  rank: number;
};

export type PoolConfig = {
  group_lock_utc: string;
  pool_name: string;
  pts_exact: number;
  pts_result: number;
  knockout_lock_hours: number;
  match_lock_hours: number;
};
