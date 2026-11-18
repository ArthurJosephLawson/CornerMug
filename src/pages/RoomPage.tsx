import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Armchair } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { usePomodoroTimer } from '@/hooks/usePomodoroTimer';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { showToast } from '@/hooks/useToast';
import { recordFocusSession, recordHangoutTime } from '@/services/statsService';
import { isPublicRoom, resolveRoomDefinition } from '@/config/rooms.config';
import { ROOM_CAPACITY, baseRoomId } from '@/types/network.types';
import type { SeatAnchor } from '@/types/engine.types';
import { AmbientMixer } from '@/components/room/AmbientMixer';
import { GameCanvas, type GameCanvasHandle } from '@/components/room/GameCanvas';
import { PomodoroWidget } from '@/components/room/PomodoroWidget';
import { RoomChatDrawer } from '@/components/room/RoomChatDrawer';
import { RoomTopBar } from '@/components/room/RoomTopBar';
import { SeatPromptBadge } from '@/components/room/SeatPromptBadge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Users } from 'lucide-react';

export function RoomPage() {
  const { roomId = '' } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isTouchDevice = useIsTouchDevice();

  const baseId = baseRoomId(roomId);
  const publicRoom = isPublicRoom(baseId);
  const definition = resolveRoomDefinition(baseId);

  const canvasRef = useRef<GameCanvasHandle | null>(null);
  const [nearSeat, setNearSeat] = useState<SeatAnchor | null>(null);
  const [seated, setSeated] = useState(false);
  const handleNearSeat = useCallback((seat: SeatAnchor | null) => setNearSeat(seat), []);
  const handleSeated = useCallback((next: boolean) => setSeated(next), []);
  const toggleSeat = useCallback(() => canvasRef.current?.toggleSeat(), []);

  const connection = useRoomConnection(
    roomId,
    profile?.id ?? '',
    profile?.username ?? '',
    profile?.avatar_slug ?? 'resident',
    { capacity: ROOM_CAPACITY, shard: publicRoom },
  );

  const handleFocusComplete = useCallback(
    (minutes: number) => {
      if (!profile) return;
      void recordFocusSession(profile.id, minutes)
        .then(() => showToast(`Focus session saved: ${minutes} minutes.`, 'success'))
        .catch(() => showToast('Could not save focus time yet.', 'error'));
    },
    [profile],
  );

  const pomodoro = usePomodoroTimer({
    focusMinutes: 25,
    breakMinutes: 5,
    onFocusComplete: handleFocusComplete,
  });

  const { elapsedSeconds } = useTimeTracker(true);
  const elapsedRef = useRef(elapsedSeconds);
  const lastFlushRef = useRef(0);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (!profile) return;
    lastFlushRef.current = elapsedRef.current;
    const interval = window.setInterval(() => {
      const delta = elapsedRef.current - lastFlushRef.current;
      if (delta >= 30) {
        lastFlushRef.current = elapsedRef.current;
        void recordHangoutTime(profile.id, delta);
      }
    }, 10_000);

    return () => {
      window.clearInterval(interval);
      const remaining = elapsedRef.current - lastFlushRef.current;
      if (remaining > 0) void recordHangoutTime(profile.id, remaining);
    };
  }, [profile]);

  if (!profile) return null;

  if (connection.roomFull) {
    return (
      <div className="space-y-4">
        <RoomTopBar
          roomName={definition.name}
          roomKey={publicRoom ? null : roomId}
          occupantCount={ROOM_CAPACITY}
          capacity={ROOM_CAPACITY}
          connected={false}
          onLeave={() => navigate('/')}
        />
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <Users className="h-10 w-10 text-charcoal/25" />
          <div>
            <p className="text-lg font-bold">Every table is full</p>
            <p className="mt-1 max-w-sm text-sm text-charcoal/55">
              {definition.name} is at its {ROOM_CAPACITY}-player limit across all tables right
              now. Give it a minute and try again — or hang out somewhere else.
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoomTopBar
        roomName={definition.name}
        roomKey={publicRoom ? null : roomId}
        occupantCount={connection.peers.length + 1}
        capacity={ROOM_CAPACITY}
        tableNumber={publicRoom ? connection.shardNumber : undefined}
        connected={connection.connected}
        onLeave={() => navigate('/')}
      />

      <div className="relative">
        <GameCanvas
          ref={canvasRef}
          roomId={roomId}
          userId={profile.id}
          username={profile.username}
          slug={profile.avatar_slug}
          connection={connection}
          onNearSeatChange={handleNearSeat}
          onSeatedChange={handleSeated}
          className="h-[60svh] min-h-[260px] w-full sm:h-[68svh]"
        />

        <SeatPromptBadge seat={nearSeat} onPress={toggleSeat} />

        {seated && isTouchDevice ? (
          <button
            type="button"
            onClick={toggleSeat}
            className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-charcoal/85 px-4 py-2 text-xs font-semibold text-ivory shadow-card backdrop-blur transition-colors active:bg-charcoal"
          >
            <Armchair className="h-4 w-4 text-lavender" /> Tap to stand up
          </button>
        ) : null}

        <div className="pointer-events-none absolute left-3 top-3 z-20">
          <AmbientMixer />
        </div>

        {isTouchDevice && !seated && !nearSeat ? (
          <div className="pointer-events-none absolute bottom-40 left-1/2 z-20 -translate-x-1/2 sm:hidden">
            <span className="rounded-full bg-charcoal/70 px-3 py-1.5 text-[11px] font-semibold text-ivory backdrop-blur">
              Walk up to a chair to sit
            </span>
          </div>
        ) : null}

        <div className="pointer-events-none absolute right-3 top-3 z-20 sm:bottom-3 sm:left-3 sm:right-auto sm:top-auto">
          <PomodoroWidget timer={pomodoro} />
        </div>

        <div className="pointer-events-none absolute bottom-3 right-3">
          <RoomChatDrawer
            messages={connection.messages}
            connected={connection.connected}
            selfId={profile.id}
            onSend={connection.sendChat}
          />
        </div>
      </div>

      <p className="text-xs text-charcoal/45">
        {isTouchDevice ? (
          <>Left stick to walk · tap the chair prompt to sit · chat stays in the room.</>
        ) : (
          <>
            WASD or arrow keys to walk · <kbd className="rounded bg-charcoal/5 px-1 font-mono">E</kbd>{' '}
            to sit · chat stays in the room.
          </>
        )}
      </p>
    </div>
  );
}