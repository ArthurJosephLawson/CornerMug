/**
 * Shared types for Corner Mug room layouts (replaces Tiled).
 * World space is fixed 640x360 px; props and seats anchor bottom-center,
 * colliders anchor top-left.
 */

export type Vec2 = { x: number; y: number };

export type Collider = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PropPlacement = {
  /** Prop key = PNG filename without extension, served at /sprites/<key>.png */
  key: string;
  /** Bottom-center position in world px */
  x: number;
  y: number;
  /** World display size */
  width: number;
  height: number;
  solid: boolean;
};

export type Facing = "left" | "right";

export type SnapSeat = {
  id: string;
  /** Bottom-center seat position in world px */
  x: number;
  y: number;
  facing: Facing;
  tableId: string;
};

export type RoomConfig = {
  id: string;
  name: string;
  /** Background PNG key, served at /sprites/<backgroundKey>.png */
  backgroundKey: string;
  backgroundSize: { width: number; height: number };
  spawn: Vec2;
  colliders: Collider[];
  props: PropPlacement[];
  snapSeats: SnapSeat[];
};

export type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: Facing;
  /** Snap-seat id while seated, null while walking */
  seatedSeatId: string | null;
};
