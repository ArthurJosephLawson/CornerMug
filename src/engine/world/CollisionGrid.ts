import type { CollisionBox } from '@/types/engine.types';

/**
 * Coarse occupancy grid built from wall rings and furniture rects. Cells are
 * 16px so collision checks stay cheap even on low-end hardware.
 */
export class CollisionGrid {
  private readonly width: number;
  private readonly height: number;
  private readonly cellSize: number;
  private readonly columns: number;
  private readonly rows: number;
  private readonly cells = new Set<number>();

  constructor(width: number, height: number, cellSize = 16) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.columns = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
  }

  addRect(rect: CollisionBox): void {
    const startColumn = Math.max(0, Math.floor(rect.x / this.cellSize));
    const endColumn = Math.min(this.columns - 1, Math.floor((rect.x + rect.w) / this.cellSize));
    const startRow = Math.max(0, Math.floor(rect.y / this.cellSize));
    const endRow = Math.min(this.rows - 1, Math.floor((rect.y + rect.h) / this.cellSize));

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        this.cells.add(row * this.columns + column);
      }
    }
  }

  isBlockedRect(rect: CollisionBox): boolean {
    const startColumn = Math.max(0, Math.floor(rect.x / this.cellSize));
    const endColumn = Math.min(this.columns - 1, Math.floor((rect.x + rect.w) / this.cellSize));
    const startRow = Math.max(0, Math.floor(rect.y / this.cellSize));
    const endRow = Math.min(this.rows - 1, Math.floor((rect.y + rect.h) / this.cellSize));

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        if (this.cells.has(row * this.columns + column)) return true;
      }
    }
    return false;
  }

  isBlockedAt(x: number, y: number): boolean {
    const column = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (column < 0 || row < 0 || column >= this.columns || row >= this.rows) return true;
    return this.cells.has(row * this.columns + column);
  }

  clear(): void {
    this.cells.clear();
  }
}
