import interior1 from "@/config/rooms/interior_1.json";
import interior2 from "@/config/rooms/interior_2.json";
import interior3 from "@/config/rooms/interior_3.json";
import type { RoomConfig } from "@/types/room";

export const WORLD_SIZE = { width: 640, height: 360 } as const;

export const ROOM_IDS = ["interior_1", "interior_2", "interior_3"] as const;
export type RoomId = (typeof ROOM_IDS)[number];

const ROOM_CONFIGS: Record<RoomId, RoomConfig> = {
  interior_1: interior1 as RoomConfig,
  interior_2: interior2 as RoomConfig,
  interior_3: interior3 as RoomConfig,
};

// Fail fast at startup if a hand-edited template is malformed.
for (const [id, config] of Object.entries(ROOM_CONFIGS)) {
  const errs = validateRoomConfig(config);
  if (errs.length > 0) {
    throw new Error(`${id}.json invalid: ${errs.join(" ")}`);
  }
}

export function isRoomId(id: string): id is RoomId {
  return (ROOM_IDS as readonly string[]).includes(id);
}

export function loadRoomConfig(id: string): RoomConfig {
  if (!isRoomId(id)) {
    throw new Error(`Unknown room: ${id}`);
  }
  // Deep-clone so scene edits (addProp, drags) never mutate the shared
  // module-level templates across remounts.
  return structuredClone(ROOM_CONFIGS[id]);
}

/**
 * Pure validation for room configs (creator exports from ?edit=true mode).
 * Accepts a partial config because callers may hand over raw edited JSON;
 * returns human-readable error strings; empty array = valid.
 */
export function validateRoomConfig(config: Partial<RoomConfig>): string[] {
  const errors: string[] = [];

  if (!config.id || typeof config.id !== "string") {
    errors.push("Room id is required.");
  }
  if (!config.backgroundKey || typeof config.backgroundKey !== "string") {
    errors.push("backgroundKey is required.");
  }
  if (
    !config.backgroundSize ||
    config.backgroundSize.width !== WORLD_SIZE.width ||
    config.backgroundSize.height !== WORLD_SIZE.height
  ) {
    errors.push(
      `backgroundSize must be ${WORLD_SIZE.width}x${WORLD_SIZE.height} (world space is fixed).`,
    );
  }
  if (
    !config.spawn ||
    typeof config.spawn.x !== "number" ||
    typeof config.spawn.y !== "number"
  ) {
    errors.push("spawn point is required.");
  }
  if (!Array.isArray(config.colliders)) {
    errors.push("colliders must be an array.");
  } else {
    for (const c of config.colliders) {
      if (typeof c.x !== "number" || typeof c.y !== "number" || c.width <= 0 || c.height <= 0) {
        errors.push(`Collider ${JSON.stringify(c)} needs x, y and positive width/height.`);
      }
    }
  }
  if (!Array.isArray(config.props)) {
    errors.push("props must be an array.");
  } else {
    for (const p of config.props) {
      if (!p.key || typeof p.key !== "string") {
        errors.push("Every prop needs a key.");
      }
      if (typeof p.x !== "number" || typeof p.y !== "number" || p.width <= 0 || p.height <= 0) {
        errors.push(`Prop ${p.key ?? "?"} needs x, y and positive width/height.`);
      }
      if (typeof p.solid !== "boolean") {
        errors.push(`Prop ${p.key ?? "?"} needs a solid flag.`);
      }
    }
  }
  if (!Array.isArray(config.snapSeats)) {
    errors.push("snapSeats must be an array.");
  } else {
    for (const s of config.snapSeats) {
      if (!s.id || typeof s.id !== "string") {
        errors.push("Every seat needs an id.");
      }
      if (!s.tableId || typeof s.tableId !== "string") {
        errors.push(`Seat ${s.id ?? "?"} needs a tableId.`);
      }
      if (s.facing !== "left" && s.facing !== "right") {
        errors.push(`Seat ${s.id ?? "?"} facing must be "left" or "right".`);
      }
      if (typeof s.x !== "number" || typeof s.y !== "number") {
        errors.push(`Seat ${s.id ?? "?"} needs x and y.`);
      }
    }
  }

  return errors;
}
