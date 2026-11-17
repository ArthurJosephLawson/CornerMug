import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { AssetLoader } from '@/engine/assets/AssetLoader';
import { GameLoop } from '@/engine/core/GameLoop';
import { InputController, type InputAxis } from '@/engine/core/InputController';
import { ViewportCamera } from '@/engine/core/ViewportCamera';
import { AnimationController } from '@/engine/entities/AnimationController';
import { PlayerEntity } from '@/engine/entities/PlayerEntity';
import { PropDepthSorter } from '@/engine/world/PropDepthSorter';
import { RoomBuilder } from '@/engine/world/RoomBuilder';
import { TileRenderer } from '@/engine/world/TileRenderer';
import { TouchJoystick } from '@/components/room/TouchJoystick';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import {
  CHARACTER_PIVOT_X,
  CHARACTER_PIVOT_Y,
  PROP_CELL_HEIGHT,
  PROP_CELL_WIDTH,
  PROP_PIVOT_X,
  PROP_PIVOT_Y,
} from '@/config/sprites.config';
import { resolveRoomDefinition } from '@/config/rooms.config';
import type { RoomConnectionState } from '@/hooks/useRoomConnection';
import { PRESENCE_BROADCAST_MS, PRESENCE_HEARTBEAT_MS } from '@/types/network.types';
import type {
  CharacterSlug,
  FrameRect,
  ParsedSpriteSheet,
  PlayerState,
  SeatAnchor,
} from '@/types/engine.types';
import type { NetworkPeer } from '@/types/network.types';

interface RemoteAvatar {
  player: PlayerEntity;
  slug: CharacterSlug;
  sheet: ParsedSpriteSheet | null;
  animator: AnimationController | null;
}

export interface GameCanvasProps {
  roomId: string;
  userId: string;
  username: string;
  slug: CharacterSlug;
  connection: RoomConnectionState;
  onNearSeatChange?: (seat: SeatAnchor | null) => void;
  onSeatedChange?: (seated: boolean) => void;
  className?: string;
}

export interface GameCanvasHandle {
  /** Sit / stand toggle, shared by the E key, the seat badge and touch. */
  toggleSeat: () => void;
}

/**
 * Canvas host for the pure-TypeScript engine. React only supplies props and
 * receives the near-seat callback; every frame runs outside React state.
 * Touch devices get an on-screen joystick and tap buttons fed to the engine
 * through refs, so the engine itself stays input-agnostic.
 */
export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  {
    roomId,
    userId,
    username,
    slug,
    connection,
    onNearSeatChange,
    onSeatedChange,
    className = '',
  },
  ref,
) {
  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peersRef = useRef<NetworkPeer[]>(connection.peers);
  const nearSeatCallbackRef = useRef(onNearSeatChange);
  const seatedCallbackRef = useRef(onSeatedChange);
  const touchAxisRef = useRef<InputAxis>({ x: 0, y: 0 });
  const interactRequestRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      toggleSeat: () => {
        interactRequestRef.current = true;
      },
    }),
    [],
  );

  useEffect(() => {
    peersRef.current = connection.peers;
  }, [connection.peers]);

  useEffect(() => {
    nearSeatCallbackRef.current = onNearSeatChange;
  }, [onNearSeatChange]);

  useEffect(() => {
    seatedCallbackRef.current = onSeatedChange;
  }, [onSeatedChange]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let disposed = false;
    let loop: GameLoop | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const loader = new AssetLoader();
    const input = new InputController();
    const sorter = new PropDepthSorter();
    const tileRenderer = new TileRenderer();

    const boot = async () => {
      const definition = resolveRoomDefinition(roomId);
      await loader.loadManifest();
      if (disposed) return;

      const built = new RoomBuilder().build(definition);
      const [floorImage, wallImage] = await Promise.all([
        loader.loadTileImage(definition.floorTile),
        loader.loadTileImage(definition.wallTile),
      ]);
      if (disposed) return;

      const propImages = new Map<string, HTMLImageElement>();
      await Promise.all(
        [...new Set(definition.props.map((prop) => prop.name))].map(async (name) => {
          const image = await loader.loadPropImage(name);
          if (image && !disposed) propImages.set(name, image);
        }),
      );
      if (disposed) return;

      const localSheet = await loader.loadSheet(slug);
      if (disposed) return;

      const sheets = new Map<CharacterSlug, ParsedSpriteSheet>([[slug, localSheet]]);
      const localAnimator = new AnimationController(localSheet);
      const player = new PlayerEntity({
        id: userId,
        username,
        slug,
        position: { ...definition.spawn },
        direction: 'south',
        moving: false,
        seated: false,
        seatId: null,
      });

      const camera = new ViewportCamera({
        worldWidth: definition.width,
        worldHeight: definition.height,
        viewportWidth: 1,
        viewportHeight: 1,
        minZoom: 1,
        maxZoom: 3,
      });

      const remotes = new Map<string, RemoteAvatar>();
      let lastNearSeatId: string | null = null;
      let lastSeated = false;
      let lastBroadcastAt = 0;
      let lastPresenceJson = '';
      let lastHeartbeatAt = 0;

      const queueSheet = (targetSlug: CharacterSlug) => {
        if (sheets.has(targetSlug)) return;
        void loader.loadSheet(targetSlug).then((sheet) => {
          if (disposed) return;
          sheets.set(targetSlug, sheet);
          for (const avatar of remotes.values()) {
            if (avatar.slug === targetSlug) avatar.sheet = sheet;
          }
        });
      };

      const nearestSeat = (): SeatAnchor | null => {
        let best: SeatAnchor | null = null;
        let bestDistance = 34;
        for (const seat of definition.seats) {
          const distance = Math.hypot(seat.x - player.state.position.x, seat.y - player.state.position.y);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = seat;
          }
        }
        return best;
      };

      const buildPresence = () => ({
        id: player.state.id,
        username: player.state.username,
        slug: player.state.slug,
        x: Math.round(player.state.position.x),
        y: Math.round(player.state.position.y),
        direction: player.state.direction,
        moving: player.state.moving,
        seated: player.state.seated,
      });

      const syncRemotes = () => {
        const peers = peersRef.current;
        const seen = new Set<string>();

        for (const peer of peers) {
          if (peer.id === userId) continue;
          seen.add(peer.id);
          let avatar = remotes.get(peer.id);
          if (!avatar) {
            avatar = {
              player: new PlayerEntity({
                id: peer.id,
                username: peer.username,
                slug: peer.slug,
                position: { x: peer.x, y: peer.y },
                direction: peer.direction,
                moving: peer.moving,
                seated: peer.seated,
                seatId: null,
              }),
              slug: peer.slug,
              sheet: sheets.get(peer.slug) ?? null,
              animator: null,
            };
            remotes.set(peer.id, avatar);
          }

          avatar.player.applyRemote({
            x: peer.x,
            y: peer.y,
            direction: peer.direction,
            moving: peer.moving,
            seated: peer.seated,
          });

          if (avatar.sheet && !avatar.animator) {
            avatar.animator = new AnimationController(avatar.sheet);
          }
          if (avatar.animator) {
            avatar.animator.play(peer.moving ? 'walk' : 'idle', peer.direction);
          }
          if (!avatar.sheet) queueSheet(peer.slug);
        }

        for (const id of [...remotes.keys()]) {
          if (!seen.has(id)) remotes.delete(id);
        }
      };

      const update = (deltaSeconds: number, _elapsedMs: number) => {
        const keyboard = input.getAxis();
        const touch = touchAxisRef.current;
        let axisX = keyboard.x + touch.x;
        let axisY = keyboard.y + touch.y;
        const axisLength = Math.hypot(axisX, axisY);
        if (axisLength > 1) {
          axisX /= axisLength;
          axisY /= axisLength;
        }
        player.setInput(axisX, axisY);
        player.update(deltaSeconds, built.collision);

        if (input.consumeInteract() || interactRequestRef.current) {
          interactRequestRef.current = false;
          if (player.state.seated) {
            player.stand();
          } else {
            const seat = nearestSeat();
            if (seat) player.sit(seat);
          }
        }

        const nearSeat = player.state.seated ? null : nearestSeat();
        const nearSeatId = nearSeat?.id ?? null;
        if (nearSeatId !== lastNearSeatId) {
          lastNearSeatId = nearSeatId;
          nearSeatCallbackRef.current?.(nearSeat);
        }
        if (player.state.seated !== lastSeated) {
          lastSeated = player.state.seated;
          seatedCallbackRef.current?.(lastSeated);
        }

        syncRemotes();

        localAnimator.play(player.state.moving ? 'walk' : 'idle', player.state.direction);
        localAnimator.update(deltaSeconds * 1000);
        for (const avatar of remotes.values()) {
          avatar.animator?.update(deltaSeconds * 1000);
        }

        const now = performance.now();
        if (now - lastBroadcastAt >= PRESENCE_BROADCAST_MS) {
          lastBroadcastAt = now;
          const presence = buildPresence();
          const serialized = JSON.stringify(presence);
          // Send on change, plus a heartbeat so idle/seated players are never
          // pruned as stale on the other clients.
          if (serialized !== lastPresenceJson || now - lastHeartbeatAt >= PRESENCE_HEARTBEAT_MS) {
            lastPresenceJson = serialized;
            lastHeartbeatAt = now;
            connection.broadcastPresence(presence);
          }
        }

        camera.follow(player.state.position);
      };

      const drawSprite = (
        sheet: ParsedSpriteSheet,
        frame: FrameRect | null,
        position: { x: number; y: number },
      ) => {
        if (!frame) return;
        context.drawImage(
          sheet.image,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          Math.round(position.x - CHARACTER_PIVOT_X),
          Math.round(position.y - CHARACTER_PIVOT_Y),
          64,
          64,
        );
      };

      const drawNameTag = (state: PlayerState) => {
        const x = Math.round(state.position.x);
        const y = Math.round(state.position.y - CHARACTER_PIVOT_Y - 6);
        context.font = '600 8px "Plus Jakarta Sans", Inter, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        const label = state.username;
        const width = context.measureText(label).width;
        context.fillStyle = 'rgba(30, 30, 36, 0.55)';
        context.fillRect(x - width / 2 - 3, y - 9, width + 6, 11);
        context.fillStyle = '#FAF7F2';
        context.fillText(label, x, y);
      };

      const render = () => {
        const width = canvas.width;
        const height = canvas.height;
        context.imageSmoothingEnabled = false;
        context.fillStyle = '#1E1E24';
        context.fillRect(0, 0, width, height);

        camera.applyTransform(context);

        tileRenderer.draw(context, definition, { floor: floorImage, wall: wallImage });

        const drawProp = (name: string, x: number, y: number) => {
          const image = propImages.get(name);
          if (!image) return;
          context.drawImage(
            image,
            Math.round(x - PROP_PIVOT_X),
            Math.round(y - PROP_PIVOT_Y),
            PROP_CELL_WIDTH,
            PROP_CELL_HEIGHT,
          );
        };

        for (const prop of definition.props) {
          if (prop.name.startsWith('wall-') || prop.name === 'rug') drawProp(prop.name, prop.x, prop.y);
        }

        const items: Array<{ groundY: number; draw: () => void }> = [];
        for (const prop of definition.props) {
          if (prop.name.startsWith('wall-') || prop.name === 'rug') continue;
          items.push({ groundY: prop.y, draw: () => drawProp(prop.name, prop.x, prop.y) });
        }

        items.push({
          groundY: player.state.position.y,
          draw: () => drawSprite(localSheet, localAnimator.getCurrentFrame(), player.state.position),
        });

        for (const avatar of remotes.values()) {
          if (!avatar.sheet || !avatar.animator) continue;
          items.push({
            groundY: avatar.player.state.position.y,
            draw: () =>
              drawSprite(avatar.sheet as ParsedSpriteSheet, avatar.animator?.getCurrentFrame() ?? null, avatar.player.state.position),
          });
        }

        for (const item of sorter.sort(items)) item.draw();

        drawNameTag(player.state);
        for (const avatar of remotes.values()) drawNameTag(avatar.player.state);

        camera.resetTransform(context);
      };

      const resize = () => {
        const width = Math.max(1, Math.floor(container.clientWidth));
        const height = Math.max(1, Math.floor(container.clientHeight));
        canvas.width = width;
        canvas.height = height;
        camera.resize(width, height);
      };

      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      resize();
      input.attach();

      loop = new GameLoop(update, render);
      loop.start();
      void connection.sendJoin();
    };

    void boot();

    return () => {
      disposed = true;
      loop?.stop();
      input.detach();
      resizeObserver?.disconnect();
      void connection.sendLeave();
    };
  }, [
    roomId,
    userId,
    username,
    slug,
    connection.broadcastPresence,
    connection.sendJoin,
    connection.sendLeave,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal ${className}`}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {isTouchDevice ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-20">
          <TouchJoystick onAxis={(axis) => { touchAxisRef.current = axis; }} />
        </div>
      ) : null}
    </div>
  );
});