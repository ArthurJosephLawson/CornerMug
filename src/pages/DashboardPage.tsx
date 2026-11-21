import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  EMPTY_STATS,
  fetchDailyActivity,
  fetchStats,
  type DailyActivityPoint,
  type StatsSnapshot,
} from '@/services/statsService';
import { Card } from '@/components/ui/Card';
import { ActiveTimeChart } from '@/components/dashboard/ActiveTimeChart';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { StudyStatsGrid } from '@/components/dashboard/StudyStatsGrid';

export function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<StatsSnapshot>(EMPTY_STATS);
  const [activity, setActivity] = useState<DailyActivityPoint[]>([]);

  useEffect(() => {
    if (!profile) return;
    void fetchStats(profile.id).then(setStats);
    void fetchDailyActivity(7).then(setActivity);
  }, [profile]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45 dark:text-white/45">Welcome back</p>
          <h1 className="mt-1 text-2xl font-bold">{profile?.username ?? 'Friend'}</h1>
          <p className="mt-1 text-sm text-charcoal/55 dark:text-white/70">
            Your progress and daily hangout activity.
          </p>
        </div>
      </section>

      <ProgressPanel xp={profile?.xp ?? 0} money={profile?.money ?? 0} />

      <StudyStatsGrid stats={stats} />

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Active time (last 7 days)</h2>
            <p className="text-sm text-charcoal/55 dark:text-white/75">
              Hangout time tracked each day.
            </p>
          </div>
        </div>
        {activity.length > 0 ? (
          <ActiveTimeChart points={activity} />
        ) : (
          <p className="text-sm text-charcoal/50 dark:text-white/70">
            No activity tracked yet. Spend time in rooms to start your chart.
          </p>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Rooms</h2>
        <p className="mt-1 text-sm text-charcoal/55 dark:text-white/70">
          No rooms available right now. New maps will be added soon.
        </p>
      </Card>
    </div>
  );
}
