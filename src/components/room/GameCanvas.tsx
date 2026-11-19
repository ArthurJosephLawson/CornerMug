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
  PET_CELL_SIZE,
  PET_DRAW_SIZE,
  PET_SHEET_URL,
  PROP_CELL_HEIGHT,
  PROP_CELL_WIDTH,
  PROP_PIVOT_X,
  PROP_PIVOT_Y,
} from '@/config/sprites.config';
import { resolveRoomDefinition } from '@/config/rooms.config';
import { rankForXp } from '@/lib/ranks';
import type { RoomConnectionState } from '@/hooks/useRoomConnection';
import { PRESENCE_BROADCAST_MS, PRESENCE_HEARTBEAT_MS } from '@/types/network.types';
import type {
  CharacterSlug,
  Direction,
  FrameRect,
  ParsedSpriteSheet,
  PlayerState,
  SeatAnchor,
} from '@/types/engine.types';
import type { NetworkPeer } from '@/types/network.types';

interface RemoteAvatar {
  player: PlayerEntity;
  slug: CharacterSlug;
  xp: number;
  sheet: ParsedSpriteSheet | null;
  animator: AnimationController | null;
  /** Local follower state for this remote player's kitten. */
  pet: { x: number; y: number; facing: number; moving: boolean; animMs: number };
  hasKitten: boolean;
}

export interface GameCanvasProps {
  roomId: string;
  userId: string;
  username: string;
  slug: CharacterSlug;
  xp?: number;
  /** Shows the laptop prop after the shop unlock. */
  ownsLaptop?: boolean;
  /** Adds the kitten follower after the shop unlock. */
  ownsKitten?: boolean;
  connection: RoomConnectionState;
  onNearSeatChange?: (seat: SeatAnchor | null) => void;
  onSeatedChange?: (seated: boolean) => void;
  onLaptopChange?: (open: boolean) => void;
  className?: string;
  /** Full-bleed presentation for the phone game mode (no rounded card). */
  fullscreen?: boolean;
  /** Zoom the camera to cover the width on wide landscape phone screens. */
  phoneViewport?: boolean;
  /** Joystick diameter in CSS pixels. */
  joystickSize?: number;
}

export interface GameCanvasHandle {
  /** Sit / stand toggle, shared by the E key, the seat badge and touch. */
  toggleSeat: () => void;
  /** Open / close the laptop, shared by the L key and the phone menu. */
  toggleLaptop: () => void;
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
    xp = 0,
    ownsLaptop = false,
    ownsKitten = false,
    connection,
    onNearSeatChange,
    onSeatedChange,
    onLaptopChange,
    className = '',
    fullscreen = false,
    phoneViewport = false,
    joystickSize = 128,
  },
  ref,
) {
  const isTouchDevice = useIsTouchDevice();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peersRef = useRef<NetworkPeer[]>(connection.peers);
  const nearSeatCallbackRef = useRef(onNearSeatChange);
  const seatedCallbackRef = useRef(onSeatedChange);
  const laptopCallbackRef = useRef(onLaptopChange);
  const xpRef = useRef(xp);
  const ownsLaptopRef = useRef(ownsLaptop);
  const ownsKittenRef = useRef(ownsKitten);
  const touchAxisRef = useRef<InputAxis>({ x: 0, y: 0 });
  const interactRequestRef = useRef(false);
  const laptopRequestRef = useRef(false);

  useImperativeHandle(
    ref,
    () => ({
      toggleSeat: () => {
        interactRequestRef.current = true;
      },
      toggleLaptop: () => {
        laptopRequestRef.current = true;
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
    laptopCallbackRef.current = onLaptopChange;
  }, [onLaptopChange]);

  useEffect(() => {
    xpRef.current = xp;
  }, [xp]);

  useEffect(() => {
    ownsLaptopRef.current = ownsLaptop;
  }, [ownsLaptop]);

  useEffect(() => {
    ownsKittenRef.current = ownsKitten;
  }, [ownsKitten]);

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
      const propNames = new Set(definition.props.map((prop) => prop.name));
      if (ownsLaptopRef.current) propNames.add('computer');
      await Promise.all(
        [...propNames].map(async (name) => {
          const image = await loader.loadPropImage(name);
          if (image && !disposed) propImages.set(name, image);
        }),
      );
      if (disposed) return;

      const localSheet = await loader.loadSheet(slug);
      if (disposed) return;

      // The kitten sheet is always loaded. The local follower is optional, but
      // other players' kittens must render even when this client never bought.
      const kittenImage = await loader.loadImage(PET_SHEET_URL).catch(() => null);
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
        widthCoverage: phoneViewport ? 0.8 : 0,
      });

      const remotes = new Map<string, RemoteAvatar>();
      const pet = {
        x: definition.spawn.x - 24,
        y: definition.spawn.y + 4,
        facing: 1,
        moving: false,
        animMs: 0,
      };
      let lastNearSeatId: string | null = null;
      let lastSeated = false;
      let laptopOpen = false;
      let lastKittenState = ownsKittenRef.current;
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
        // Generous radius: on phones the joystick makes fine positioning hard,
        // and nobody enjoys pixel-hunting a chair.
        let bestDistance = 52;
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
        xp: xpRef.current,
        hasKitten: ownsKittenRef.current,
        x: Math.round(player.state.position.x),
        y: Math.round(player.state.position.y),
        direction: player.state.direction,
        moving: player.state.moving,
        seated: player.state.seated,
      });

      const kittenTarget = (
        state: { x: number; y: number },
        direction: Direction,
        seated: boolean,
      ): { x: number; y: number } => {
        const position = state;
        let targetX = position.x - 24;
        let targetY = position.y + 4;
        if (seated) {
          targetX = position.x + 24;
          targetY = position.y + 6;
        } else if (direction === 'east') {
          targetX = position.x - 24;
          targetY = position.y + 4;
        } else if (direction === 'west') {
          targetX = position.x + 24;
          targetY = position.y + 4;
        } else if (direction === 'north') {
          targetX = position.x + 20;
          targetY = position.y + 16;
        } else {
          targetX = position.x - 20;
          targetY = position.y - 16;
        }
        return { x: targetX, y: targetY };
      };

      const syncRemotes = () => {
        const peers = peersRef.current;
        const seen = new Set<string>();

        for (const peer of peers) {
          if (peer.id === userId) continue;
          seen.add(peer.id);
          let avatar = remotes.get(peer.id);
          if (!avatar) {
            const target = kittenTarget(
              { x: peer.x, y: peer.y },
              peer.direction,
              peer.seated,
            );
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
              xp: peer.xp ?? 0,
              sheet: sheets.get(peer.slug) ?? null,
              animator: null,
              pet: {
                x: target.x,
                y: target.y,
                facing: 1,
                moving: false,
                animMs: 0,
              },
              hasKitten: peer.hasKitten === true,
            };
            remotes.set(peer.id, avatar);
          }
          avatar.xp = peer.xp ?? 0;
          avatar.hasKitten = peer.hasKitten === true;

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

      const moveKitten = (
        kitten: { x: number; y: number; facing: number; moving: boolean; animMs: number },
        targetX: number,
        targetY: number,
        deltaSeconds: number,
      ) => {
        const deltaX = targetX - kitten.x;
        const deltaY = targetY - kitten.y;
        const distance = Math.hypot(deltaX, deltaY);
        const step = Math.min(1, deltaSeconds * 6);
        kitten.x += deltaX * step;
        kitten.y += deltaY * step;
        kitten.moving = distance > 4;
        if (Math.abs(deltaX) > 1) kitten.facing = deltaX > 0 ? 1 : -1;
        kitten.animMs += deltaSeconds * 1000;
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

        if (ownsKittenRef.current) {
          const target = kittenTarget(
            player.state.position,
            player.state.direction,
            player.state.seated,
          );
          moveKitten(pet, target.x, target.y, deltaSeconds);
        }

        if (input.consumeInteract() || interactRequestRef.current) {
          interactRequestRef.current = false;
          if (player.state.seated) {
            player.stand(built.collision);
          } else {
            const seat = nearestSeat();
            if (seat) player.sit(seat);
          }
        }

        if (input.consumeLaptopToggle() || laptopRequestRef.current) {
          laptopRequestRef.current = false;
          if (ownsLaptopRef.current) {
            laptopOpen = !laptopOpen;
            laptopCallbackRef.current?.(laptopOpen);
          } else {
            laptopCallbackRef.current?.(false);
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

        for (const avatar of remotes.values()) {
          if (!avatar.hasKitten) continue;
          const state = avatar.player.state;
          const target = kittenTarget(state.position, state.direction, state.seated);
          moveKitten(avatar.pet, target.x, target.y, deltaSeconds);
        }

        localAnimator.play(player.state.moving ? 'walk' : 'idle', player.state.direction);
        localAnimator.update(deltaSeconds * 1000);
        for (const avatar of remotes.values()) {
          avatar.animator?.update(deltaSeconds * 1000);
        }

        const hasKitten = ownsKittenRef.current;
        if (hasKitten !== lastKittenState) {
          lastKittenState = hasKitten;
          lastPresenceJson = '';
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

      const drawNameTag = (state: PlayerState, totalXp: number) => {
        const x = Math.round(state.position.x);
        const y = Math.round(state.position.y - CHARACTER_PIVOT_Y - 6);
        context.font = '600 8px "Plus Jakarta Sans", Inter, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'bottom';

        const rank = rankForXp(totalXp);
        const nameLabel = state.username;
        const rankLabel = ` [${rank.name}]`;
        const nameWidth = context.measureText(nameLabel).width;
        const rankWidth = context.measureText(rankLabel).width;
        const left = x - (nameWidth + rankWidth) / 2;

        context.fillStyle = 'rgba(30, 30, 36, 0.55)';
        context.fillRect(left - 3, y - 9, nameWidth + rankWidth + 6, 11);
        context.fillStyle = '#FAF7F2';
        context.fillText(nameLabel, left, y);
        context.fillStyle = rank.color;
        context.fillText(rankLabel, left + nameWidth, y);
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

        const drawKitten = () => {
          if (!kittenImage) return;
          const row = pet.moving ? (pet.facing > 0 ? 1 : 2) : 0;
          const frame = pet.moving
            ? Math.floor(pet.animMs / 90) % 8
            : Math.floor(pet.animMs / 650) % 2;
          context.drawImage(
            kittenImage,
            frame * PET_CELL_SIZE,
            row * PET_CELL_SIZE,
            PET_CELL_SIZE,
            PET_CELL_SIZE,
            Math.round(pet.x - PET_DRAW_SIZE / 2),
            Math.round(pet.y - (PET_DRAW_SIZE * 25) / PET_CELL_SIZE),
            PET_DRAW_SIZE,
            PET_DRAW_SIZE,
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

        if (ownsKittenRef.current) {
          items.push({ groundY: pet.y, draw: drawKitten });
        }

        if (laptopOpen) {
          // Sits just south of the player so it reads as "on the table in front".
          const laptopY = player.state.position.y + 4;
          items.push({
            groundY: laptopY,
            draw: () => drawProp('computer', player.state.position.x, laptopY),
          });
        }

        for (const avatar of remotes.values()) {
          if (avatar.hasKitten && kittenImage) {
            const kitten = avatar.pet;
            const row = kitten.moving ? (kitten.facing > 0 ? 1 : 2) : 0;
            const frame = kitten.moving
              ? Math.floor(kitten.animMs / 90) % 8
              : Math.floor(kitten.animMs / 650) % 2;
            items.push({
              groundY: kitten.y,
              draw: () => {
                if (!kittenImage) return;
                context.drawImage(
                  kittenImage,
                  frame * PET_CELL_SIZE,
                  row * PET_CELL_SIZE,
                  PET_CELL_SIZE,
                  PET_CELL_SIZE,
                  Math.round(kitten.x - PET_DRAW_SIZE / 2),
                  Math.round(kitten.y - (PET_DRAW_SIZE * 25) / PET_CELL_SIZE),
                  PET_DRAW_SIZE,
                  PET_DRAW_SIZE,
                );
              },
            });
          }
          if (!avatar.sheet || !avatar.animator) continue;
          items.push({
            groundY: avatar.player.state.position.y,
            draw: () =>
              drawSprite(avatar.sheet as ParsedSpriteSheet, avatar.animator?.getCurrentFrame() ?? null, avatar.player.state.position),
          });
        }

        for (const item of sorter.sort(items)) item.draw();

        drawNameTag(player.state, xpRef.current);
        for (const avatar of remotes.values()) drawNameTag(avatar.player.state, avatar.xp);

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
    phoneViewport,
  ]);

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? `relative h-full w-full overflow-hidden bg-charcoal ${className}`
          : `relative overflow-hidden rounded-2xl border border-charcoal/10 bg-charcoal ${className}`
      }
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        style={{ imageRendering: 'pixelated' }}
      />

      {isTouchDevice ? (
        <div
          className={`pointer-events-none absolute z-20 ${
            fullscreen ? 'bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] left-3' : 'bottom-3 left-3'
          }`}
        >
          <TouchJoystick size={joystickSize} onAxis={(axis) => { touchAxisRef.current = axis; }} />
        </div>
      ) : null}
    </div>
  );
});