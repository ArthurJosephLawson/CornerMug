import type { CollisionGrid } from '../world/CollisionGrid';
import type { Direction, PlayerState, SeatAnchor, Vector2 } from '@/types/engine.types';

const BODY_HALF_WIDTH = 6;
const BODY_HEIGHT = 12;
const BODY_FEET_OFFSET = 4;

/**
 * Local or remote avatar movement. Positions are the sprite pivot (ground
 * point). Collision uses a small box just above the feet so players can stand
 * close to furniture without clipping through it.
 */
export class PlayerEntity {
  state: PlayerState;
  readonly speed = 82;

  private inputX = 0;
  private inputY = 0;

  constructor(initial: PlayerState) {
    this.state = {
      ...initial,
      position: { ...initial.position },
    };
  }

  setInput(x: number, y: number): void {
    this.inputX = Math.max(-1, Math.min(1, x));
    this.inputY = Math.max(-1, Math.min(1, y));
  }

  update(deltaSeconds: number, collision: CollisionGrid): void {
    if (this.state.seated) {
      this.state.moving = false;
      return;
    }

    const moving = Math.abs(this.inputX) > 0.01 || Math.abs(this.inputY) > 0.01;
    this.state.moving = moving;
    if (!moving) return;

    const deltaX = this.inputX * this.speed * deltaSeconds;
    const deltaY = this.inputY * this.speed * deltaSeconds;

    this.tryMove(deltaX, 'x', collision);
    this.tryMove(deltaY, 'y', collision);

    if (Math.abs(this.inputX) > Math.abs(this.inputY)) {
      this.state.direction = this.inputX > 0 ? 'east' : 'west';
    } else {
      this.state.direction = this.inputY > 0 ? 'south' : 'north';
    }
  }

  sit(seat: SeatAnchor): void {
    this.state.seated = true;
    this.state.seatId = seat.id;
    this.state.position = { x: seat.x, y: seat.y };
    this.state.direction = seat.facing;
    this.state.moving = false;
    this.inputX = 0;
    this.inputY = 0;
  }

  stand(collision?: CollisionGrid): void {
    this.state.seated = false;
    this.state.seatId = null;
    // Chairs sit inside neighbouring tables' collision cells, so standing up
    // on the exact seat anchor can block every direction. Hop to the nearest
    // free body position instead of freezing the player.
    if (collision && collision.isBlockedRect(this.getBodyBox(this.state.position))) {
      const free = this.findFreeSpot(collision);
      if (free) this.state.position = free;
    }
  }

  teleport(position: Vector2): void {
    this.state.position = { ...position };
  }

  applyRemote(payload: { x: number; y: number; direction: Direction; moving: boolean; seated: boolean }): void {
    this.state.position.x = payload.x;
    this.state.position.y = payload.y;
    this.state.direction = payload.direction;
    this.state.moving = payload.moving;
    this.state.seated = payload.seated;
    if (payload.seated) this.state.seatId = 'remote-seat';
  }

  private tryMove(delta: number, axis: 'x' | 'y', collision: CollisionGrid): void {
    const next = { ...this.state.position };
    if (axis === 'x') next.x += delta;
    else next.y += delta;

    const box = this.getBodyBox(next);
    if (!collision.isBlockedRect(box)) {
      this.state.position = next;
    }
  }

  /**
   * Widening rings around the current position, preferring the direction the
   * player will face when standing (south first, out of the chair).
   */
  private findFreeSpot(collision: CollisionGrid): Vector2 | null {
    const origin = this.state.position;
    const directions: Array<[number, number]> = [
      [0, 1],
      [0.7071, 0.7071],
      [-0.7071, 0.7071],
      [1, 0],
      [-1, 0],
      [0.7071, -0.7071],
      [-0.7071, -0.7071],
      [0, -1],
    ];

    for (let radius = 8; radius <= 72; radius += 8) {
      for (const [dx, dy] of directions) {
        const candidate = { x: origin.x + dx * radius, y: origin.y + dy * radius };
        if (!collision.isBlockedRect(this.getBodyBox(candidate))) return candidate;
      }
    }
    return null;
  }

  private getBodyBox(position: Vector2) {
    return {
      x: position.x - BODY_HALF_WIDTH,
      y: position.y - BODY_FEET_OFFSET - BODY_HEIGHT,
      w: BODY_HALF_WIDTH * 2,
      h: BODY_HEIGHT,
    };
  }
}
