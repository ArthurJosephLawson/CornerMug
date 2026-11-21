import { supabase } from '@/lib/supabaseClient';

export interface StatsSnapshot {
  focusMinutes: number;
  hangoutSeconds: number;
  sessionsCompleted: number;
}

export interface DailyActivityPoint {
  date: string; // YYYY-MM-DD
  activeSeconds: number;
}

export const EMPTY_STATS: StatsSnapshot = {
  focusMinutes: 0,
  hangoutSeconds: 0,
  sessionsCompleted: 0,
};

export async function fetchStats(userId: string): Promise<StatsSnapshot> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('focus_minutes, hangout_seconds, sessions_completed')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return EMPTY_STATS;
  const row = data as Record<string, unknown>;
  return {
    focusMinutes: Number(row.focus_minutes ?? 0),
    hangoutSeconds: Number(row.hangout_seconds ?? 0),
    sessionsCompleted: Number(row.sessions_completed ?? 0),
  };
}

async function upsertStats(userId: string, snapshot: StatsSnapshot): Promise<void> {
  const { error } = await supabase.from('user_stats').upsert(
    {
      user_id: userId,
      focus_minutes: Math.round(snapshot.focusMinutes),
      hangout_seconds: Math.round(snapshot.hangoutSeconds),
      sessions_completed: Math.round(snapshot.sessionsCompleted),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw new Error(error.message);
}

export async function recordFocusSession(userId: string, minutes: number): Promise<StatsSnapshot> {
  const current = await fetchStats(userId);
  const next: StatsSnapshot = {
    ...current,
    focusMinutes: current.focusMinutes + minutes,
    sessionsCompleted: current.sessionsCompleted + 1,
  };
  await upsertStats(userId, next);
  return next;
}

export async function recordHangoutTime(userId: string, seconds: number): Promise<StatsSnapshot> {
  if (seconds <= 0) return fetchStats(userId);
  const current = await fetchStats(userId);
  const next: StatsSnapshot = {
    ...current,
    hangoutSeconds: current.hangoutSeconds + Math.round(seconds),
  };
  await upsertStats(userId, next);
  return next;
}

export async function fetchDailyActivity(days = 7): Promise<DailyActivityPoint[]> {
  const { data, error } = await supabase.rpc('get_daily_activity', { p_days: days });
  if (error) return [];
  const rows = Array.isArray(data) ? data : [];
  return rows.map((row) => {
    const item = row as Record<string, unknown>;
    return {
      date: String(item.activity_date ?? item.date ?? ''),
      activeSeconds: Number(item.active_seconds ?? item.seconds ?? 0),
    };
  });
}
