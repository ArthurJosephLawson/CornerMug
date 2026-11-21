import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PUBLIC_ROOMS, bedroomRoomId } from '@/config/rooms.config';
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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ActiveTimeChart } from '@/components/dashboard/ActiveTimeChart';
import { PrivateRoomModal } from '@/components/dashboard/PrivateRoomModal';
import { ProgressPanel } from '@/components/dashboard/ProgressPanel';
import { PublicRoomCard } from '@/components/dashboard/PublicRoomCard';
import { StudyStatsGrid } from '@/components/dashboard/StudyStatsGrid';

export function DashboardPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [stats, setStats] = useState<StatsSnapshot>(EMPTY_STATS);
  const [activity, setActivity] = useState<DailyActivityPoint[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
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
          <p className="mt-1 text-sm text-charcoal/55 dark:text-white/60">
            Pick a spot, settle in, and let the focus happen.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Private space
        </Button>
      </section>

      <ProgressPanel xp={profile?.xp ?? 0} money={profile?.money ?? 0} />

      <StudyStatsGrid stats={stats} />

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Active time (last 7 days)</h2>
            <p className="text-sm text-charcoal/55 dark:text-white/60">
              Hangout time tracked each day.
            </p>
          </div>
        </div>
        {activity.length > 0 ? (
          <ActiveTimeChart points={activity} />
        ) : (
          <p className="text-sm text-charcoal/50 dark:text-white/50">
            No activity tracked yet. Spend time in rooms to start your chart.
          </p>
        )}
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Public rooms</h2>
          <span className="pill bg-sage/60 text-charcoal">
            <Sparkles className="h-3.5 w-3.5" /> open to everyone
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card tone="butter" className="flex flex-col items-start gap-3">
          <div>
            <h3 className="font-bold">My Room</h3>
            <p className="mt-1 text-sm text-charcoal/60 dark:text-white/65">
              Your personal bedroom. Invite friends with a private link.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              if (!profile) return;
              navigate(`/room/${bedroomRoomId(profile.id)}`);
            }}
          >
            Enter My Room
          </Button>
        </Card>

        <Card tone="lavender" className="flex flex-col items-start gap-3">
          <div>
            <h3 className="font-bold">Host your own quiet table</h3>
            <p className="mt-1 text-sm text-charcoal/60 dark:text-white/65">
              Generate a room key and share it with friends. Only people with the key can join.
            </p>
          </div>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Create private room
          </Button>
        </Card>
      </section>

      <PrivateRoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onJoined={(roomId) => navigate(`/room/${roomId}`)}
      />
    </div>
  );
}