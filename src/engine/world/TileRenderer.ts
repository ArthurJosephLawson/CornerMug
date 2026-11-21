import { TILE_CELL_HEIGHT, TILE_CELL_WIDTH } from '@/config/sprites.config';
import type { RoomDefinition } from '@/types/engine.types';

export interface TileImages {
  floor: HTMLImageElement | null;
  wall: HTMLImageElement | null;
  background?: HTMLImageElement | null;
}

/**
 * Draws the floor field and the wall ring in world space. Assumes the caller
 * has already applied the camera transform and disabled image smoothing.
 */
export class TileRenderer {
  draw(context: CanvasRenderingContext2D, room: RoomDefinition, images: TileImages): void {
    const tile = TILE_CELL_WIDTH;

    context.fillStyle = '#EFE9DF';
    context.fillRect(0, 0, room.width, room.height);

    if (images.background) {
      context.drawImage(images.background, 0, 0, room.width, room.height);
      return;
    }

    this.drawFloor(context, room, images.floor, tile);
    this.drawWalls(context, room, images.wall, tile);
  }

  private drawFloor(
    context: CanvasRenderingContext2D,
    room: RoomDefinition,
    image: HTMLImageElement | null,
    tile: number,
  ): void {
    const startX = tile;
    const startY = tile;
    const width = room.width - tile * 2;
    const height = room.height - tile * 2;

    if (!image) {
      context.fillStyle = '#E7DFD2';
      context.fillRect(startX, startY, width, height);
      return;
    }

    for (let y = startY; y < startY + height; y += tile) {
      for (let x = startX; x < startX + width; x += tile) {
        context.drawImage(image, x, y, TILE_CELL_WIDTH, TILE_CELL_HEIGHT);
      }
    }
  }

  private drawWalls(
    context: CanvasRenderingContext2D,
    room: RoomDefinition,
    image: HTMLImageElement | null,
    tile: number,
  ): void {
    const drawCell = (x: number, y: number) => {
      if (image) {
        context.drawImage(image, x, y, TILE_CELL_WIDTH, TILE_CELL_HEIGHT);
      } else {
        context.fillStyle = '#CBB8A6';
        context.fillRect(x, y, TILE_CELL_WIDTH, TILE_CELL_HEIGHT);
      }
    };

    for (let x = 0; x < room.width; x += tile) {
      drawCell(x, 0);
      drawCell(x, room.height - tile);
    }
    for (let y = tile; y < room.height - tile; y += tile) {
      drawCell(0, y);
      drawCell(room.width - tile, y);
    }
  }
}
