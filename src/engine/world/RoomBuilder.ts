import { TILE_CELL_SIZE } from '@/config/tiles.config';
import type { CollisionBox, PropPlacement, RoomDefinition } from '@/types/engine.types';
import { CollisionGrid } from './CollisionGrid';

export interface BuiltRoom {
  definition: RoomDefinition;
  collision: CollisionGrid;
}

const PASSABLE_PROPS = new Set(['rug']);
const PROP_COLLISION_SIZE = { halfWidth: 20, height: 22, feetOffset: 18 };

/**
 * Turns a RoomDefinition into a collision grid: a solid wall ring plus one
 * box per blocking prop. Seats stay unblocked so players can stand on their
 * snap anchor.
 */
export class RoomBuilder {
  build(definition: RoomDefinition): BuiltRoom {
    const collision = new CollisionGrid(definition.width, definition.height);

    const thickness = TILE_CELL_SIZE;
    collision.addRect({ x: 0, y: 0, w: definition.width, h: thickness });
    collision.addRect({ x: 0, y: definition.height - thickness, w: definition.width, h: thickness });
    collision.addRect({ x: 0, y: 0, w: thickness, h: definition.height });
    collision.addRect({ x: definition.width - thickness, y: 0, w: thickness, h: definition.height });

    const seatKeys = new Set(
      definition.seats.map((seat) => `${Math.round(seat.x)},${Math.round(seat.y)}`),
    );

    for (const prop of definition.props) {
      if (PASSABLE_PROPS.has(prop.name) || prop.name.startsWith('wall-')) continue;
      if (seatKeys.has(`${Math.round(prop.x)},${Math.round(prop.y)}`)) continue;

      const box = propCollisionBox(prop);
      if (box) collision.addRect(box);
    }

    for (const rect of definition.blockedRects) {
      collision.addRect(rect);
    }

    return { definition, collision };
  }
}

function propCollisionBox(prop: PropPlacement): CollisionBox | null {
  if (prop.name === 'plant-small') {
    return { x: prop.x - 10, y: prop.y - 20, w: 20, h: 16 };
  }
  return {
    x: prop.x - PROP_COLLISION_SIZE.halfWidth,
    y: prop.y - PROP_COLLISION_SIZE.feetOffset,
    w: PROP_COLLISION_SIZE.halfWidth * 2,
    h: PROP_COLLISION_SIZE.height,
  };
}
