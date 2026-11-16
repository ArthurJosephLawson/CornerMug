import * as Phaser from "phaser";
import { loadRoomConfig, WORLD_SIZE } from "@/lib/rooms";
import type { Facing, RoomConfig, SnapSeat } from "@/types/room";
import {
  applyFallbacks,
  fallbackTextureKey,
  FALLBACK_COLORS,
  type AssetSpec,
} from "@/game/fallback";
import { seatHasLaptop } from "@/game/playability";

const MOVE_SPEED = 140;
const SEAT_RANGE = 48;
/** Default player art set (creator's first character). */
const PLAYER_KEY = "male";
const SPEECH_MS = 4000;

type SpeechBubble = {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
};

/**
 * The cafe scene: loads a room's background + player textures + placed props
 * from /sprites/<key>.png. Missing PNGs render as labeled colored rectangles
 * (fallback.ts) so the game always runs.
 *
 * Page-facing API: getRoomConfigJson(), addProp(), showSpeech(), isEdit.
 */
export default class MainCafeScene extends Phaser.Scene {
  readonly isEdit: boolean;
  private roomId: string;
  room: RoomConfig;

  private player!: Phaser.Physics.Arcade.Sprite;
  private playerFacing: Facing = "right";
  private seatedSeatId: string | null = null;
  private seatedStudy = false;
  private activeTableId = "cafe";

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private seatMarkers: { seat: SnapSeat; marker: Phaser.GameObjects.Rectangle }[] = [];
  private propEntries: { prop: RoomConfig["props"][number]; sprite: Phaser.GameObjects.Image }[] = [];
  private spawnMarker: Phaser.GameObjects.Rectangle | null = null;
  private bubble: SpeechBubble | null = null;
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;

  constructor(roomId: string, edit: boolean) {
    super("MainCafe");
    this.roomId = roomId;
    this.isEdit = edit;
    this.room = loadRoomConfig(roomId);
  }

  preload(): void {
    const toLoad: { key: string; url: string }[] = [
      { key: this.room.backgroundKey, url: `/sprites/${this.room.backgroundKey}.png` },
      { key: `${PLAYER_KEY}_left`, url: `/sprites/${PLAYER_KEY}_left.png` },
      { key: `${PLAYER_KEY}_right`, url: `/sprites/${PLAYER_KEY}_right.png` },
    ];
    for (const prop of this.room.props) {
      toLoad.push({ key: prop.key, url: `/sprites/${prop.key}.png` });
    }
    for (const asset of toLoad) {
      this.load.image(asset.key, asset.url);
    }

    // Missing files are expected while the creator is still drawing.
    this.load.on("loaderror", () => {
      /* falls back in create() */
    });
  }

  create(): void {
    const specs = this.buildAssetSpecs();
    applyFallbacks(this, specs);

    this.addBackground();
    this.addColliders();
    this.addProps();
    this.addSeatMarkers();
    this.addPlayer();
    this.setupKeys();
    this.setupSeatClicks();

    if (this.isEdit) {
      this.drawEditGrid();
    }

    // Signal the page that the scene is interactive (API is safe to call now).
    this.game.events.emit("maincafe-scene-ready", this);
  }

  update(): void {
    this.handleMovement();
    this.player.setDepth(this.player.y);
    if (this.bubble) {
      this.bubble.container.setPosition(this.player.x, this.player.y - 36);
    }
  }

  // ----- Public API (called from the React page) -----

  /** Current room layout as pretty JSON (for the edit-mode export). */
  getRoomConfigJson(): string {
    return JSON.stringify(this.room, null, 2);
  }

  /** Table id chat/speech is scoped to: seat's tableId while seated, "cafe" while walking. */
  getActiveTableId(): string {
    return this.activeTableId;
  }

  /** True when seated at a desk with a laptop — study mode. */
  getStudyMode(): boolean {
    return this.seatedStudy;
  }

  /** Add a prop at a bottom-center world position (edit mode). */
  addProp(key: string, x: number, y: number): void {
    const prop = { key, x, y, width: 32, height: 32, solid: false };
    this.room.props.push(prop);
    this.renderProp(prop);
  }

  /** Show a speech bubble above the player for a few seconds. */
  showSpeech(text: string, tableId?: string): void {
    const trimmed = text.trim();
    if (trimmed === "") {
      return;
    }
    const scope = tableId ?? this.activeTableId;

    if (!this.bubble) {
      const textObj = this.add.text(0, 0, trimmed, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#2A1E17",
        align: "center",
        wordWrap: { width: 110 },
      });
      textObj.setOrigin(0.5, 0.5);
      const bg = this.add.graphics();
      this.bubble = { container: this.add.container(0, 0, [bg, textObj]), text: textObj };
    }
    this.bubble.text.setText(trimmed);

    const t = this.bubble.text;
    const bg = this.bubble.container.list[0] as Phaser.GameObjects.Graphics;
    bg.clear();
    bg.fillStyle(0xf5efe6, 1);
    bg.fillRect(t.x - t.width / 2 - 4, t.y - t.height / 2 - 3, t.width + 8, t.height + 6);
    this.bubble.container.setDepth(10_000);

    if (this.bubbleTimer !== null) {
      this.time.removeEvent(this.bubbleTimer);
    }
    this.bubbleTimer = this.time.delayedCall(SPEECH_MS, () => {
      this.bubble?.container.setVisible(false);
      this.bubbleTimer = null;
    });
    this.bubble.container.setVisible(true);
    this.bubble.container.setPosition(this.player.x, this.player.y - 36);

    // Speech is scoped to the table the player is seated at; walking
    // defaults to the global "cafe" channel.
    this.bubble.container.setData("tableId", scope);
  }

  // ----- Asset specs + rendering -----

  private buildAssetSpecs(): AssetSpec[] {
    const specs: AssetSpec[] = [
      {
        key: this.room.backgroundKey,
        url: `/sprites/${this.room.backgroundKey}.png`,
        width: WORLD_SIZE.width,
        height: WORLD_SIZE.height,
        color: FALLBACK_COLORS.bg,
        label: this.room.backgroundKey,
      },
      {
        key: `${PLAYER_KEY}_left`,
        url: `/sprites/${PLAYER_KEY}_left.png`,
        width: 32,
        height: 48,
        color: FALLBACK_COLORS.char,
        label: `${PLAYER_KEY}_left`,
      },
      {
        key: `${PLAYER_KEY}_right`,
        url: `/sprites/${PLAYER_KEY}_right.png`,
        width: 32,
        height: 48,
        color: FALLBACK_COLORS.char,
        label: `${PLAYER_KEY}_right`,
      },
    ];
    for (const prop of this.room.props) {
      specs.push({
        key: prop.key,
        url: `/sprites/${prop.key}.png`,
        width: prop.width,
        height: prop.height,
        color: FALLBACK_COLORS.prop,
        label: prop.key,
      });
    }
    return specs;
  }

  /** Texture key to display: real art when loaded, else the fallback rect. */
  private tex(key: string): string {
    return this.textures.exists(key) ? key : fallbackTextureKey(key);
  }

  private addBackground(): void {
    this.add
      .image(0, 0, this.tex(this.room.backgroundKey))
      .setOrigin(0, 0)
      .setDisplaySize(WORLD_SIZE.width, WORLD_SIZE.height)
      .setDepth(-1000);
  }

  private addColliders(): void {
    for (const c of this.room.colliders) {
      const zone = this.add.zone(c.x + c.width / 2, c.y + c.height / 2, c.width, c.height);
      this.physics.add.existing(zone, true);
    }
  }

  private addProps(): void {
    for (const prop of this.room.props) {
      this.renderProp(prop);
    }
  }

  private renderProp(prop: RoomConfig["props"][number]): void {
    const index = this.propEntries.length;
    const sprite = this.add
      .image(prop.x, prop.y, this.tex(prop.key))
      .setOrigin(0.5, 1)
      .setDisplaySize(prop.width, prop.height)
      .setDepth(prop.y);
    sprite.setData("propIndex", index);
    this.propEntries.push({ prop, sprite });

    if (this.isEdit) {
      sprite.setInteractive({ useHandCursor: true, draggable: true, pixelPerfect: false });
    }

    if (prop.solid) {
      const zone = this.add.zone(
        prop.x,
        prop.y - prop.height / 2,
        prop.width,
        prop.height,
      );
      this.physics.add.existing(zone, true);
    }
  }

  private addSeatMarkers(): void {
    for (const seat of this.room.snapSeats) {
      const marker = this.add
        .rectangle(seat.x, seat.y, 20, 20, FALLBACK_COLORS.seat, 0.5)
        .setStrokeStyle(1, 0xf5efe6, 0.9)
        .setInteractive({ useHandCursor: true });
      marker.setDepth(seat.y);
      this.seatMarkers.push({ seat, marker });
    }
  }

  private addPlayer(): void {
    this.player = this.physics.add.sprite(
      this.room.spawn.x,
      this.room.spawn.y,
      this.tex(`${PLAYER_KEY}_${this.playerFacing}`),
    );
    this.player.setDisplaySize(32, 48);
    // Hitbox in source-texture pixels: creator art may be 2x/4x exports
    // scaled down, so body sizes must be divided by the sprite scale.
    const scale = this.player.scaleX;
    // Feet-area collision box within the 32x48 world sprite.
    this.player.body?.setSize(Math.round(20 / scale), Math.round(12 / scale));
    this.player.body?.setOffset(Math.round(6 / scale), Math.round(34 / scale));
    // Hard world bounds: player can never leave the 640x360 playable area.
    (this.player.body as Phaser.Physics.Arcade.Body).collideWorldBounds = true;
    this.physics.add.collider(
      this.player,
      this.physics.world.staticBodies.entries as unknown as Phaser.GameObjects.GameObject[],
    );

    this.player.setDepth(this.player.y);
  }

  private setupKeys(): void {
    if (!this.input.keyboard) {
      throw new Error("MainCafeScene requires keyboard input.");
    }
    this.keys = this.input.keyboard.addKeys(
      "W,A,S,D,UP,LEFT,DOWN,RIGHT",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  /** Disable/enable WASD+arrows while the user types in HTML inputs. */
  setKeyboardEnabled(enabled: boolean): void {
    if (this.input.keyboard) {
      this.input.keyboard.enabled = enabled;
    }
  }

  private setupSeatClicks(): void {
    for (const { seat, marker } of this.seatMarkers) {
      marker.setData("seatId", seat.id);
      marker.on("pointerdown", () => {
        if (this.isEdit || this.seatedSeatId === seat.id) {
          return;
        }
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, seat.x, seat.y);
        if (dist <= SEAT_RANGE) {
          this.seatAt(seat);
        }
      });
    }
  }

  private seatAt(seat: SnapSeat): void {
    this.seatedSeatId = seat.id;
    this.seatedStudy = seatHasLaptop(seat, this.room.props);
    this.activeTableId = seat.tableId;
    this.player.setVelocity(0, 0);
    this.player.setPosition(seat.x, seat.y);
    this.playerFacing = seat.facing;
    this.player.setTexture(this.tex(`${PLAYER_KEY}_${seat.facing}`));
    this.player.setDepth(this.player.y);
  }

  private handleMovement(): void {
    const k = this.keys;
    if (!k) {
      return;
    }
    // Seated players do not move — they are parked at their snap seat.
    if (this.seatedSeatId !== null) {
      return;
    }
    const left = k.A.isDown || k.LEFT.isDown;
    const right = k.D.isDown || k.RIGHT.isDown;
    const up = k.W.isDown || k.UP.isDown;
    const down = k.S.isDown || k.DOWN.isDown;

    let vx = 0;
    let vy = 0;
    if (left && !right) {
      vx = -MOVE_SPEED;
    } else if (right && !left) {
      vx = MOVE_SPEED;
    }
    if (up && !down) {
      vy = -MOVE_SPEED;
    } else if (down && !up) {
      vy = MOVE_SPEED;
    }
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    if (vx !== 0 || vy !== 0) {
      this.seatedSeatId = null;
      if (vx < 0 && this.playerFacing !== "left") {
        this.playerFacing = "left";
        this.player.setTexture(this.tex(`${PLAYER_KEY}_left`));
      } else if (vx > 0 && this.playerFacing !== "right") {
        this.playerFacing = "right";
        this.player.setTexture(this.tex(`${PLAYER_KEY}_right`));
      }
    }

    // Player body is guaranteed on a physics sprite.
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  private drawEditGrid(): void {
    const grid = this.add.graphics().setDepth(-900);
    grid.lineStyle(1, 0x000000, 0.15);
    for (let x = 0; x <= WORLD_SIZE.width; x += 16) {
      grid.lineBetween(x, 0, x, WORLD_SIZE.height);
    }
    for (let y = 0; y <= WORLD_SIZE.height; y += 16) {
      grid.lineBetween(0, y, WORLD_SIZE.width, y);
    }

    // Spawn marker (draggable)
    this.spawnMarker = this.add.rectangle(
      this.room.spawn.x,
      this.room.spawn.y,
      12,
      12,
      FALLBACK_COLORS.npc,
      0.8,
    );
    this.spawnMarker.setStrokeStyle(1, 0x2a1e17);
    this.spawnMarker.setDepth(10_000);
    this.spawnMarker.setInteractive({ useHandCursor: true, draggable: true });
    this.spawnMarker.setData("isSpawn", true);
    this.add
      .text(this.room.spawn.x, this.room.spawn.y + 10, "SPAWN", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#2A1E17",
      })
      .setOrigin(0.5, 0)
      .setDepth(10_000);

    // Seats are draggable in edit mode
    for (const { seat, marker } of this.seatMarkers) {
      marker.setInteractive({ useHandCursor: true, draggable: true });
      marker.setData("seatIndex", this.room.snapSeats.indexOf(seat));
    }

    this.setupDrag();
  }

  private setupDrag(): void {
    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        obj: Phaser.GameObjects.GameObject,
        rawX: number,
        rawY: number,
      ) => {
        const dragX = Phaser.Math.Clamp(Math.round(rawX), 0, WORLD_SIZE.width);
        const dragY = Phaser.Math.Clamp(Math.round(rawY), 0, WORLD_SIZE.height);
        const propIndex = obj.getData("propIndex") as number | undefined;
        if (typeof propIndex === "number" && this.propEntries[propIndex]) {
          const { prop, sprite } = this.propEntries[propIndex];
          prop.x = dragX;
          prop.y = dragY;
          sprite.setPosition(prop.x, prop.y);
          sprite.setDepth(prop.y);
          return;
        }

        if (obj.getData("isSpawn") === true) {
          this.room.spawn.x = dragX;
          this.room.spawn.y = dragY;
          (obj as Phaser.GameObjects.Rectangle).setPosition(dragX, dragY);
          return;
        }

        const seatIndex = obj.getData("seatIndex") as number | undefined;
        if (typeof seatIndex === "number" && this.room.snapSeats[seatIndex]) {
          const seat = this.room.snapSeats[seatIndex];
          seat.x = dragX;
          seat.y = dragY;
          (obj as Phaser.GameObjects.Rectangle).setPosition(dragX, dragY);
          (obj as Phaser.GameObjects.Rectangle).setDepth(seat.y);
        }
      },
    );
  }
}
