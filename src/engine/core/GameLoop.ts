export type UpdateCallback = (deltaSeconds: number, elapsedMs: number) => void;
export type RenderCallback = () => void;

const MAX_DELTA_SECONDS = 0.05;

/**
 * requestAnimationFrame loop decoupled from React. Update receives a clamped
 * delta so tab switches never teleport entities.
 */
export class GameLoop {
  private readonly update: UpdateCallback;
  private readonly render: RenderCallback;
  private rafId: number | null = null;
  private lastTime = 0;
  private elapsedMs = 0;
  private running = false;

  constructor(update: UpdateCallback, render: RenderCallback) {
    this.update = update;
    this.render = render;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  private tick = (time: number): void => {
    if (!this.running) return;

    const rawDelta = (time - this.lastTime) / 1000;
    this.lastTime = time;
    const delta = Math.min(Math.max(rawDelta, 0), MAX_DELTA_SECONDS);
    this.elapsedMs += delta * 1000;

    this.update(delta, this.elapsedMs);
    this.render();

    this.rafId = requestAnimationFrame(this.tick);
  };
}
