export type Direction = 'south' | 'east' | 'north' | 'west';

export type CharacterSlug =
  | 'resident'
  | 'barista'
  | 'cook'
  | 'courier'
  | 'maintenance-worker'
  | 'office-worker';

export interface Vector2 {
  x: number;
  y: number;
}

export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnimationFrame extends FrameRect {
  durationMs: number;
}

export interface AnimationClip {
  name: string;
  action: 'idle' | 'walk';
  direction: Direction;
  loop: boolean;
  frames: AnimationFrame[];
}

export interface ParsedSpriteSheet {
  slug: CharacterSlug;
  image: HTMLImageElement;
  cellWidth: number;
  cellHeight: number;
  pivotX: number;
  pivotY: number;
  clips: Record<string, AnimationClip>;
}

export interface TileInfo {
  name: string;
  file: string;
  atlas: string;
  rect: FrameRect;
}

export interface PropInfo {
  name: string;
  file: string;
  atlas: string;
  rect: FrameRect;
  pivot: Vector2;
}

export interface CharacterManifestEntry {
  slug: CharacterSlug;
  name: string;
  aligned_metadata: string;
  standing_metadata: string;
}

export interface PropPlacement {
  name: string;
  x: number;
  y: number;
}

export interface RoomManifestEntry {
  name: string;
  rect: [number, number, number, number];
  floor: number;
  wall: number;
}

export interface SpriteManifest {
  name: string;
  version: string;
  tileCell: [number, number];
  propCell: [number, number];
  propPivot: [number, number];
  alignedCharacterCell: [number, number];
  alignedCharacterPivot: [number, number];
  sceneSize: [number, number];
  characters: CharacterManifestEntry[];
  props: PropInfo[];
  tiles: TileInfo[];
  propPlacements: PropPlacement[];
  rooms: RoomManifestEntry[];
}

export interface SeatAnchor {
  id: string;
  propName: string;
  x: number;
  y: number;
  facing: Direction;
}

export interface CollisionBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoomDefinition {
  id: string;
  name: string;
  width: number;
  height: number;
  floorTile: string;
  wallTile: string;
  spawn: Vector2;
  seats: SeatAnchor[];
  props: PropPlacement[];
  blockedRects: CollisionBox[];
}

export interface PlayerState {
  id: string;
  username: string;
  slug: CharacterSlug;
  position: Vector2;
  direction: Direction;
  moving: boolean;
  seated: boolean;
  seatId: string | null;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  sentAt: number;
}

export interface PresencePayload {
  id: string;
  username: string;
  slug: CharacterSlug;
  /** Total XP, used by other clients to draw the `Name [Rank]` tag. */
  xp?: number;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
  seated: boolean;
}

export interface JoinSignal {
  id: string;
  username: string;
  slug: CharacterSlug;
  xp?: number;
}

export interface LeaveSignal {
  id: string;
}
