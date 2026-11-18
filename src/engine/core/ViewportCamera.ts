import type { Vector2 } from '@/types/engine.types';

interface CameraOptions {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  minZoom?: number;
  maxZoom?: number;
  /**
   * Landscape phones give a viewport far wider than the room. When set above
   * zero the camera zooms in until the room covers that fraction of the
   * viewport width, cropping vertically instead of letterboxing.
   */
  widthCoverage?: number;
}

/**
 * Integer-zoom camera that keeps the player centred and clamps to world
 * bounds. Rounds every translation so pixel art never samples subpixels.
 */
export class ViewportCamera {
  worldWidth: number;
  worldHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  minZoom: number;
  maxZoom: number;
  widthCoverage: number;

  zoom = 1;
  center: Vector2 = { x: 0, y: 0 };

  constructor(options: CameraOptions) {
    this.worldWidth = options.worldWidth;
    this.worldHeight = options.worldHeight;
    this.viewportWidth = options.viewportWidth;
    this.viewportHeight = options.viewportHeight;
    this.minZoom = options.minZoom ?? 1;
    this.maxZoom = options.maxZoom ?? 4;
    this.widthCoverage = options.widthCoverage ?? 0;
    this.recalculateZoom();
    this.center = { x: this.worldWidth / 2, y: this.worldHeight / 2 };
  }

  resize(viewportWidth: number, viewportHeight: number): void {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.recalculateZoom();
  }

  follow(target: Vector2): void {
    this.center.x = target.x;
    this.center.y = target.y;
  }

  get offsetX(): number {
    return Math.round(this.center.x - this.viewportWidth / this.zoom / 2);
  }

  get offsetY(): number {
    return Math.round(this.center.y - this.viewportHeight / this.zoom / 2);
  }

  clampToWorld(offset: Vector2): Vector2 {
    const maxOffsetX = Math.max(0, this.worldWidth - this.viewportWidth / this.zoom);
    const maxOffsetY = Math.max(0, this.worldHeight - this.viewportHeight / this.zoom);
    return {
      x: Math.min(Math.max(offset.x, 0), maxOffsetX),
      y: Math.min(Math.max(offset.y, 0), maxOffsetY),
    };
  }

  /**
   * Camera offset for the current frame. Follows the player and clamps to
   * world bounds; when the world is smaller than the viewport it letterboxes
   * the map centred instead of pinning it to the top-left corner.
   */
  get currentOffset(): Vector2 {
    const visibleWidth = this.viewportWidth / this.zoom;
    const visibleHeight = this.viewportHeight / this.zoom;
    const centerOffsetX = -Math.round((visibleWidth - this.worldWidth) / 2);
    const centerOffsetY = -Math.round((visibleHeight - this.worldHeight) / 2);

    if (visibleWidth >= this.worldWidth && visibleHeight >= this.worldHeight) {
      return { x: centerOffsetX, y: centerOffsetY };
    }

    const clamped = this.clampToWorld({ x: this.offsetX, y: this.offsetY });
    return {
      x: visibleWidth >= this.worldWidth ? centerOffsetX : clamped.x,
      y: visibleHeight >= this.worldHeight ? centerOffsetY : clamped.y,
    };
  }

  applyTransform(context: CanvasRenderingContext2D): void {
    const offset = this.currentOffset;
    context.save();
    context.scale(this.zoom, this.zoom);
    context.translate(-Math.round(offset.x), -Math.round(offset.y));
  }

  resetTransform(context: CanvasRenderingContext2D): void {
    context.restore();
  }

  screenToWorld(screenX: number, screenY: number): Vector2 {
    const offset = this.currentOffset;
    return {
      x: screenX / this.zoom + offset.x,
      y: screenY / this.zoom + offset.y,
    };
  }

  private recalculateZoom(): void {
    if (this.viewportWidth <= 0 || this.viewportHeight <= 0) {
      this.zoom = this.minZoom;
      return;
    }
    const fitZoom = Math.min(
      this.viewportWidth / this.worldWidth,
      this.viewportHeight / this.worldHeight,
    );
    let zoom = Math.max(Math.floor(fitZoom), this.minZoom);

    if (this.widthCoverage > 0) {
      const coverZoom = Math.ceil((this.viewportWidth * this.widthCoverage) / this.worldWidth);
      // Keep at least ~90 world pixels of vertical context so the player can
      // still see where they are walking.
      const maxByHeight = Math.max(1, Math.floor(this.viewportHeight / 90));
      zoom = Math.max(zoom, Math.min(coverZoom, maxByHeight));
    }

    this.zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);
  }
}
