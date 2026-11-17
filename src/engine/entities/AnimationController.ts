import { clipKey } from '@/config/sprites.config';
import type { AnimationClip, Direction, FrameRect, ParsedSpriteSheet } from '@/types/engine.types';

/**
 * Advances frame timing for one character sheet. Idle clips run at their
 * authored 300ms cadence; walk clips run at 100ms.
 */
export class AnimationController {
  private readonly sheet: ParsedSpriteSheet;
  private clip: AnimationClip | null = null;
  private frameIndex = 0;
  private elapsedMs = 0;

  constructor(sheet: ParsedSpriteSheet) {
    this.sheet = sheet;
    this.play('idle', 'south');
  }

  play(action: 'idle' | 'walk', direction: Direction): void {
    const next = this.sheet.clips[clipKey(action, direction)] ?? null;
    const currentKey = this.clip ? `${this.clip.action}_${this.clip.direction}` : '';
    const nextKey = next ? `${next.action}_${next.direction}` : '';

    if (currentKey === nextKey) return;

    this.clip = next;
    this.frameIndex = 0;
    this.elapsedMs = 0;
  }

  update(deltaMs: number): void {
    if (!this.clip || this.clip.frames.length === 0) return;

    this.elapsedMs += deltaMs;
    const duration = this.clip.frames[this.frameIndex]?.durationMs ?? 300;
    if (this.elapsedMs < duration) return;

    this.elapsedMs -= duration;
    this.frameIndex += 1;
    if (this.frameIndex >= this.clip.frames.length) {
      this.frameIndex = this.clip.loop ? 0 : this.clip.frames.length - 1;
      this.elapsedMs = 0;
    }
  }

  getCurrentFrame(): FrameRect | null {
    if (!this.clip) return null;
    const frame = this.clip.frames[this.frameIndex];
    if (!frame) return null;
    return { x: frame.x, y: frame.y, w: frame.w, h: frame.h };
  }

  get clipName(): string | null {
    return this.clip?.name ?? null;
  }
}
