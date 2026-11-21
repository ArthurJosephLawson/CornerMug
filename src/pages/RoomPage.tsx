import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Armchair,
  ArrowLeft,
  Copy,
  LogOut,
  Maximize2,
  MessageCircle,
  Minimize2,
  MoreHorizontal,
  RotateCw,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRoomConnection } from '@/hooks/useRoomConnection';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import { usePhoneViewport } from '@/hooks/usePhoneViewport';
import { usePomodoro } from '@/context/PomodoroContext';
import { useTimeTracker } from '@/hooks/useTimeTracker';
import { showToast } from '@/hooks/useToast';
import { recordHangoutTime } from '@/services/statsService';
import { MENU_ITEMS, awardHangout, purchaseItem } from '@/services/progressService';
import { rankForXp } from '@/lib/ranks';
import { isPublicRoom, resolveRoomDefinition } from '@/config/rooms.config';
import { ROOM_CAPACITY, baseRoomId } from '@/types/network.types';
import type { SeatAnchor } from '@/types/engine.types';
import { AmbientMixer } from '@/components/room/AmbientMixer';
import { GameCanvas, type GameCanvasHandle, type NearbyNpcState } from '@/components/room/GameCanvas';
import { NpcMenuBubble, type NpcMenuItem } from '@/components/room/NpcMenuBubble';
import { PomodoroWidget } from '@/components/room/PomodoroWidget';
import { RoomChatDrawer } from '@/components/room/RoomChatDrawer';
import { RoomTopBar } from '@/components/room/RoomTopBar';
import { SeatPromptBadge } from '@/components/room/SeatPromptBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const NPC_MENU_ITEMS: NpcMenuItem[] = MENU_ITEMS.map((item) => ({
  id: item.id,
  name: item.name,
  priceMoney: item.price,
  image: item.image ?? '',
}));

export function RoomPage() {
  const { roomId = '' } = useParams();
  const { profile, applyProgress } = useAuth();
  const navigate = useNavigate();
  const isTouchDevice = useIsTouchDevice();
  const { isPhone, isPortrait } = usePhoneViewport();

  const baseId = baseRoomId(roomId);
  const publicRoom = isPublicRoom(baseId);
  const definition = resolveRoomDefinition(baseId);

  const canvasRef = useRef<GameCanvasHandle | null>(null);
  const [nearSeat, setNearSeat] = useState<SeatAnchor | null>(null);
  const [seated, setSeated] = useState(false);
  const [nearbyNpc, setNearbyNpc] = useState<NearbyNpcState | null>(null);
  const [menuNpc, setMenuNpc] = useState<NearbyNpcState | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [menuBusyId, setMenuBusyId] = useState<string | null>(null);
  const handleNearSeat = useCallback((seat: SeatAnchor | null) => setNearSeat(seat), []);
  const handleSeated = useCallback((next: boolean) => setSeated(next), []);
  const handleNearbyNpc = useCallback((npc: NearbyNpcState | null) => setNearbyNpc(npc), []);
  const toggleSeat = useCallback(() => canvasRef.current?.toggleSeat(), []);
  const interact = useCallback(() => canvasRef.current?.interact(), []);
  const handleNpcAction = useCallback((npc: NearbyNpcState) => {
    setMenuNpc((current) => (current?.id === npc.id ? null : npc));
  }, []);

  const [hudMenuOpen, setHudMenuOpen] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ownsKitten = profile?.owned_items.includes('kitten') ?? false;

  const connection = useRoomConnection(
    roomId,
    profile?.id ?? '',
    profile?.username ?? '',
    profile?.avatar_slug ?? 'resident',
    { capacity: ROOM_CAPACITY, shard: publicRoom },
  );

  const pomodoro = usePomodoro();

  const { elapsedSeconds } = useTimeTracker(true);
  const elapsedRef = useRef(elapsedSeconds);
  const lastFlushRef = useRef(0);
  const xpRef = useRef(profile?.xp ?? 0);
  const profileId = profile?.id ?? '';

  useEffect(() => {
    if (!menuNpc) {
      setMenuPos(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      const pos = canvasRef.current?.getNpcScreenPosition(menuNpc.id);
      if (pos) setMenuPos(pos);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [menuNpc]);

  useEffect(() => {
    if (menuNpc && !nearbyNpc) {
      setMenuNpc(null);
    }
  }, [menuNpc, nearbyNpc]);

  const handleMenuBuy = useCallback(async (itemId: string) => {
    if (menuBusyId) return;
    setMenuBusyId(itemId);
    try {
      const result = await purchaseItem(itemId as never);
      applyProgress({
        xp: result.xp,
        money: result.money,
        owned_items: result.owned_items,
      });
      const item = MENU_ITEMS.find((entry) => entry.id === itemId);
      if (result.already_owned) {
        showToast(`${item?.name ?? 'That treat'} is already unlocked.`, 'info');
      } else {
        showToast(`${item?.name ?? 'Treat'} unlocked.`, 'success');
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Purchase failed.';
      if (/function|schema cache|does not exist|Could not find|Unknown item/i.test(message)) {
        showToast('Menu is not ready yet: run the updated progress SQL migration.', 'error');
      } else if (/Not enough money/i.test(message)) {
        showToast('Not enough money for that treat.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setMenuBusyId(null);
    }
  }, [applyProgress, menuBusyId]);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    xpRef.current = profile?.xp ?? 0;
  }, [profile?.xp]);

  useEffect(() => {
    if (!profileId) return;

    const flush = (seconds: number) => {
      if (seconds <= 0) return;
      void awardHangout(seconds)
        .then((result) => {
          const previousRank = rankForXp(xpRef.current);
          const nextRank = rankForXp(result.xp);
          xpRef.current = result.xp;
          applyProgress({
            xp: result.xp,
            money: result.money,
            owned_items: result.owned_items,
          });
          if (nextRank.level > previousRank.level) {
            showToast(`Rank up! You are now ${nextRank.name}.`, 'success');
          }
        })
        .catch(() => {
          // Progress migration not applied yet: keep the old stats-only path.
          void recordHangoutTime(profileId, seconds);
        });
    };

    lastFlushRef.current = elapsedRef.current;
    const interval = window.setInterval(() => {
      const delta = elapsedRef.current - lastFlushRef.current;
      if (delta >= 30) {
        lastFlushRef.current = elapsedRef.current;
        flush(delta);
      }
    }, 10_000);

    return () => {
      window.clearInterval(interval);
      const remaining = elapsedRef.current - lastFlushRef.current;
      flush(remaining);
    };
  }, [profileId, applyProgress]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // The phone game is a fixed overlay; keep the page behind it still.
  useEffect(() => {
    if (!isPhone) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isPhone]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (!document.documentElement.requestFullscreen) {
        showToast('This browser does not support fullscreen.', 'info');
        return;
      }
      await document.documentElement.requestFullscreen();
      const orientation = window.screen.orientation as unknown as
        | { lock?: (mode: 'landscape') => Promise<void> }
        | undefined;
      if (orientation && typeof orientation.lock === 'function') {
        try {
          await orientation.lock('landscape');
        } catch {
          // Orientation lock is optional; keep playing.
        }
      }
    } catch {
      showToast('This browser does not support fullscreen.', 'info');
    }
  }, []);

  const copyRoomKey = useCallback(async () => {
    if (!roomId || publicRoom) return;
    try {
      await navigator.clipboard.writeText(roomId);
      showToast('Room key copied.', 'success');
    } catch {
      showToast(roomId, 'info');
    }
  }, [roomId, publicRoom]);

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

  const occupants = connection.peers.length + 1;
  const leaveRoom = () => navigate('/');

  if (isPhone) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-charcoal text-ivory">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-2 pb-1.5 pt-[calc(0.375rem+env(safe-area-inset-top,0px))]">
          <button
            type="button"
            onClick={leaveRoom}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-ivory active:bg-white/20"
            aria-label="Leave room"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight">{definition.name}</p>
            <p className="flex flex-wrap items-center gap-1.5 text-[10px] leading-tight text-ivory/60">
              {publicRoom ? (
                <span>Table #{connection.shardNumber}</span>
              ) : (
                <span className="font-mono">{roomId}</span>
              )}
              <span aria-hidden>·</span>
              <span>
                {occupants} / {ROOM_CAPACITY}
              </span>
              <span aria-hidden>·</span>
              <span className={connection.connected ? 'text-sage' : 'text-pink'}>
                {connection.connected ? 'live' : 'offline'}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <AmbientMixer compact />
            <div className="hidden min-[360px]:block">
              <PomodoroWidget timer={pomodoro} compact />
            </div>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-ivory active:bg-white/20"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => setHudMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-ivory active:bg-white/20"
              aria-label="Room menu"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="relative flex-1 overflow-hidden">
          <GameCanvas
            ref={canvasRef}
            roomId={roomId}
            userId={profile.id}
            username={profile.username}
            slug={profile.avatar_slug}
            xp={profile.xp}
            ownsKitten={ownsKitten}
            connection={connection}
            onNearSeatChange={handleNearSeat}
            onSeatedChange={handleSeated}
            onNearbyNpcChange={handleNearbyNpc}
            onNpcAction={handleNpcAction}
            fullscreen
            phoneViewport
            joystickSize={140}
          />

          {menuNpc && menuPos ? (
            <NpcMenuBubble
              open
              npcName={menuNpc.name}
              items={NPC_MENU_ITEMS}
              ownedItems={profile.owned_items}
              money={profile.money}
              x={menuPos.x}
              y={menuPos.y}
              busyId={menuBusyId}
              onClose={() => setMenuNpc(null)}
              onBuy={(id) => void handleMenuBuy(id)}
            />
          ) : null}

          <div className="pointer-events-auto absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] right-3 z-20 flex flex-col items-end gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold shadow-card backdrop-blur transition-opacity ${
                seated
                  ? 'bg-lavender text-charcoal'
                  : nearbyNpc
                    ? 'bg-butter text-charcoal'
                    : nearSeat
                      ? 'bg-ivory text-charcoal'
                      : 'pointer-events-none bg-charcoal/70 text-ivory/60'
              }`}
            >
              {seated
                ? 'Seated'
                : nearbyNpc
                  ? `${nearbyNpc.name} nearby`
                  : nearSeat
                    ? `Chair nearby · ${nearSeat.propName.replace('-', ' ')}`
                    : 'Walk to a chair or cook'}
            </span>

            {nearbyNpc && !seated ? (
              <button
                type="button"
                onClick={interact}
                className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full bg-butter text-[10px] font-bold text-charcoal shadow-card ring-4 ring-butter/50 transition-transform active:scale-95"
                aria-label={`Talk to ${nearbyNpc.name}`}
              >
                <MessageCircle className="h-6 w-6" />
                Menu
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSeat}
                disabled={!seated && !nearSeat}
                className={`flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold shadow-card transition-transform active:scale-95 ${
                  seated
                    ? 'bg-lavender text-charcoal'
                    : nearSeat
                      ? 'bg-ivory text-charcoal ring-4 ring-lavender/60'
                      : 'bg-ivory/20 text-ivory/50'
                }`}
                aria-label={seated ? 'Stand up' : nearSeat ? 'Sit on this chair' : 'No chair in reach'}
              >
                <Armchair className="h-6 w-6" />
                {seated ? 'Stand' : 'Sit'}
              </button>
            )}

            <RoomChatDrawer
              messages={connection.messages}
              connected={connection.connected}
              selfId={profile.id}
              onSend={connection.sendChat}
              compact
            />
          </div>

          {isPortrait && !rotateDismissed ? (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-charcoal/90 px-6 text-center backdrop-blur">
              <RotateCw className="h-10 w-10 text-lavender" />
              <p className="text-base font-bold">Turn your phone sideways</p>
              <p className="max-w-xs text-xs text-ivory/70">
                CornerMug plays best in landscape: a wider room and bigger controls.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleFullscreen()}
                  className="rounded-full bg-lavender px-4 py-2 text-xs font-bold text-charcoal active:scale-95"
                >
                  Go fullscreen
                </button>
                <button
                  type="button"
                  onClick={() => setRotateDismissed(true)}
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-ivory active:scale-95"
                >
                  Play anyway
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <BottomSheet open={hudMenuOpen} onClose={() => setHudMenuOpen(false)} title="Room menu">
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">
              In this room · {occupants}
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold shadow-soft">
                <AvatarPreview slug={profile.avatar_slug} size={20} className="rounded" />
                You
              </li>
              {connection.peers.map((peer) => (
                <li
                  key={peer.id}
                  className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold shadow-soft"
                >
                  <AvatarPreview slug={peer.slug} size={20} className="rounded" />
                  <span className="max-w-[9rem] truncate">{peer.username}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setHudMenuOpen(false);
                void toggleFullscreen();
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold shadow-soft active:scale-[0.99]"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              <span className="ml-auto text-[11px] font-medium text-charcoal/45">more room</span>
            </button>

            {!publicRoom ? (
              <button
                type="button"
                onClick={() => void copyRoomKey()}
                className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left text-sm font-semibold shadow-soft active:scale-[0.99]"
              >
                <Copy className="h-4 w-4" />
                Copy room key
                <span className="ml-auto font-mono text-[11px] font-medium text-charcoal/45">
                  {roomId}
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setHudMenuOpen(false);
                leaveRoom();
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-pink/70 px-4 py-3 text-left text-sm font-semibold text-charcoal shadow-soft active:scale-[0.99]"
            >
              <LogOut className="h-4 w-4" />
              Leave room
            </button>
          </div>

          <p className="mt-4 rounded-xl bg-sage/25 px-3 py-2 text-xs leading-relaxed text-charcoal/65">
            Left stick walks. The chair button lights up when a seat is in reach. Ambient sound and
            the focus timer are in the top bar.
          </p>
        </BottomSheet>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RoomTopBar
        roomName={definition.name}
        roomKey={publicRoom ? null : roomId}
        occupantCount={occupants}
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
          xp={profile.xp}
          ownsKitten={ownsKitten}
          connection={connection}
          onNearSeatChange={handleNearSeat}
          onSeatedChange={handleSeated}
          onNearbyNpcChange={handleNearbyNpc}
          onNpcAction={handleNpcAction}
          className="h-[60svh] min-h-[260px] w-full sm:h-[68svh]"
        />

        {menuNpc && menuPos ? (
          <NpcMenuBubble
            open
            npcName={menuNpc.name}
            items={NPC_MENU_ITEMS}
            ownedItems={profile.owned_items}
            money={profile.money}
            x={menuPos.x}
            y={menuPos.y}
            busyId={menuBusyId}
            onClose={() => setMenuNpc(null)}
            onBuy={(id) => void handleMenuBuy(id)}
          />
        ) : null}

        <SeatPromptBadge seat={nearSeat} onPress={toggleSeat} />
        {nearbyNpc && !seated ? (
          <button
            type="button"
            onClick={interact}
            className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-butter px-4 py-2 text-xs font-semibold text-charcoal shadow-card backdrop-blur transition-colors active:scale-95"
          >
            <MessageCircle className="h-4 w-4" /> Talk to {nearbyNpc.name} (E)
          </button>
        ) : null}

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

        {isTouchDevice && !seated && !nearSeat && !nearbyNpc ? (
          <div className="pointer-events-none absolute bottom-40 left-1/2 z-20 -translate-x-1/2 sm:hidden">
            <span className="rounded-full bg-charcoal/70 px-3 py-1.5 text-[11px] font-semibold text-ivory backdrop-blur">
              Walk up to a chair or cook
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

      <p className="text-xs text-charcoal/45 dark:text-white/45">
        {isTouchDevice ? (
          <>Left stick to walk · tap the chair prompt to sit · chat stays in the room.</>
        ) : (
          <>
            WASD or arrow keys to walk · <kbd className="rounded bg-charcoal/5 px-1 font-mono">E</kbd>{' '}
            to sit or interact · chat stays in the room.
          </>
        )}
      </p>
    </div>
  );
}
