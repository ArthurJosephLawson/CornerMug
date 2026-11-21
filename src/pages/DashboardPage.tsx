import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROOMS } from '@/config/rooms.config';
import { useRoomOccupancy } from '@/hooks/useRoomOccupancy';
import { listRooms } from '@/services/roomService';
import {
  EMPTY_STATS,
  fetchDailyActivity,
  fetchStats,
  type DailyActivityPoint,
  type StatsSnapshot,
} from '@/services/statsService';
import type { RoomRow } from '@/types/database.types';
import { Card } from '@/components/ui/Card';
import { ActiveTimeChart } from '@/components/dashboard/ActiveTimeChart';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { PublicRoomCard } from '@/components/dashboard/PublicRoomCard';
import { StudyStatsGrid } from '@/components/dashboard/StudyStatsGrid';

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [stats, setStats] = useState<StatsSnapshot>(EMPTY_STATS);
  const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
  const occupancy = useRoomOccupancy(PUBLIC_ROOMS.map((room) => room.id));

  useEffect(() => {
    void listRooms().then(setRooms);
  }, []);

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
            Pick a spot, settle in, and let the focus happen.
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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Rooms</h2>
          <span className="pill bg-sage/60 text-charcoal">
            <Sparkles className="h-3.5 w-3.5" /> New maps on top
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <PublicRoomCard
              key={room.id}
              room={room}
              occupantCount={occupancy[room.id] ?? 0}
              onEnter={(roomId) => navigate(`/room/${roomId}`)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
