import * as Phaser from "phaser";
import { loadRoomConfig, WORLD_SIZE } from "@/lib/rooms";
import type { Facing, RoomConfig, SnapSeat } from "@/types/room";
import {
  applyFallbacks,
  fallbackTextureKey,
  FALLBACK_COLORS,
  type AssetSpec,
} from "@/game/fallback";

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
  private room: RoomConfig;

  private player!: Phaser.Physics.Arcade.Sprite;
  private playerFacing: Facing = "right";
  private seatedSeatId: string | null = null;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private seatMarkers: { seat: SnapSeat; marker: Phaser.GameObjects.Rectangle }[] = [];
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

  /** Add a prop at a bottom-center world position (edit mode). */
  addProp(key: string, x: number, y: number): void {
    const prop = { key, x, y, width: 32, height: 32, solid: false };
    this.room.props.push(prop);
    this.renderProp(prop);
  }

  /** Show a speech bubble above the player for a few seconds. */
  showSpeech(text: string): void {
    const trimmed = text.trim();
    if (trimmed === "") {
      return;
    }

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
    const sprite = this.add
      .image(prop.x, prop.y, this.tex(prop.key))
      .setOrigin(0.5, 1)
      .setDisplaySize(prop.width, prop.height)
      .setDepth(prop.y);
    sprite.setData("propKey", prop.key);

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
    // Feet-area collision box within the 32x48 sprite.
    this.player.body?.setSize(20, 12);
    this.player.body?.setOffset(6, 34);
    this.physics.add.collider(
      this.player,
      this.physics.world.staticBodies.entries as unknown as Phaser.GameObjects.GameObject[],
    );

    this.player.setDepth(this.player.y);
  }

  private setupKeys(): void {
    this.keys = this.input.keyboard?.addKeys(
      "W,A,S,D,UP,LEFT,DOWN,RIGHT",
    ) as Record<string, Phaser.Input.Keyboard.Key>;
  }

  private setupSeatClicks(): void {
    for (const { seat } of this.seatMarkers) {
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, seat.x, seat.y);
        if (dist <= SEAT_RANGE) {
          this.seatAt(seat);
        }
      });
    }
  }

  private seatAt(seat: SnapSeat): void {
    this.seatedSeatId = seat.id;
    this.player.setVelocity(0, 0);
    this.player.setPosition(seat.x, seat.y);
    this.playerFacing = seat.facing;
    this.player.setTexture(this.tex(`${PLAYER_KEY}_${seat.facing}`));
    this.player.setDepth(this.player.y);
  }

  private handleMovement(): void {
    const k = this.keys;
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

    // Spawn marker
    const spawn = this.add.rectangle(
      this.room.spawn.x,
      this.room.spawn.y,
      12,
      12,
      FALLBACK_COLORS.npc,
      0.8,
    );
    spawn.setStrokeStyle(1, 0x2a1e17);
    spawn.setDepth(10_000);
    this.add
      .text(this.room.spawn.x, this.room.spawn.y + 10, "SPAWN", {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#2A1E17",
      })
      .setOrigin(0.5, 0)
      .setDepth(10_000);
  }
}
