import type { PropPlacement, RoomDefinition, RoomNpc } from '@/types/engine.types';

// Modern Rooms & People v0.2.0 by HappyHustle only.
// Coordinates normalized to each room's origin (manifest scene rects).

const cafeProps: PropPlacement[] = [
  { name: 'wall-window', x: 48, y: 39 },
  { name: 'wall-clock', x: 170, y: 32 },
  { name: 'wall-art', x: 220, y: 42 },
  { name: 'counter', x: 56, y: 102 },
  { name: 'counter', x: 104, y: 102 },
  { name: 'espresso-machine', x: 49, y: 82 },
  { name: 'pastry-case', x: 106, y: 82 },
  { name: 'kitchen-cabinet', x: 191, y: 71 },
  { name: 'fridge', x: 227, y: 77 },
  { name: 'plant-large', x: 18, y: 110 },
  { name: 'bar-stool', x: 58, y: 131 },
  { name: 'bar-stool', x: 104, y: 131 },
  { name: 'cafe-table', x: 53, y: 206 },
  { name: 'cafe-chair', x: 27, y: 198 },
  { name: 'cafe-chair', x: 82, y: 198 },
  { name: 'cafe-table', x: 176, y: 207 },
  { name: 'cafe-chair', x: 150, y: 199 },
  { name: 'cafe-chair', x: 205, y: 199 },
  { name: 'sofa', x: 61, y: 310 },
  { name: 'coffee-table', x: 62, y: 330 },
  { name: 'armchair', x: 184, y: 311 },
  { name: 'plant-large', x: 225, y: 330 },
];

const cafeNpcs: RoomNpc[] = [
  {
    id: 'cafe-cook',
    name: 'Cook',
    slug: 'cook',
    x: 80,
    y: 86,
    direction: 'south',
    interactionRadius: 34,
    action: 'menu',
  },
];

const workspaceProps: PropPlacement[] = [
  { name: 'wall-window', x: 67, y: 33 },
  { name: 'wall-art', x: 174, y: 32 },
  { name: 'bookcase', x: 241, y: 68 },
  { name: 'printer', x: 17, y: 47 },
  { name: 'filing-cabinet', x: 17, y: 76 },
  { name: 'desk', x: 73, y: 89 },
  { name: 'desk', x: 145, y: 89 },
  { name: 'computer', x: 72, y: 68 },
  { name: 'computer', x: 142, y: 68 },
  { name: 'office-chair', x: 73, y: 113 },
  { name: 'office-chair', x: 142, y: 113 },
  { name: 'water-cooler', x: 205, y: 82 },
  { name: 'parcel-stack', x: 222, y: 158 },
  { name: 'toolbox', x: 15, y: 162 },
  { name: 'plant-large', x: 259, y: 152 },
];

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    id: 'public-cafe',
    name: 'Café',
    width: 256,
    height: 352,
    floorTile: 'cream-tile',
    wallTile: 'wall-sage',
    spawn: { x: 128, y: 300 },
    seats: [
      { id: 'cafe-bar-a', propName: 'bar-stool', x: 58, y: 131, facing: 'south' },
      { id: 'cafe-bar-b', propName: 'bar-stool', x: 104, y: 131, facing: 'south' },
      { id: 'cafe-chair-a', propName: 'cafe-chair', x: 27, y: 198, facing: 'south' },
      { id: 'cafe-chair-b', propName: 'cafe-chair', x: 82, y: 198, facing: 'south' },
      { id: 'cafe-chair-c', propName: 'cafe-chair', x: 150, y: 199, facing: 'south' },
      { id: 'cafe-chair-d', propName: 'cafe-chair', x: 205, y: 199, facing: 'south' },
      { id: 'cafe-sofa', propName: 'sofa', x: 61, y: 310, facing: 'north' },
      { id: 'cafe-armchair', propName: 'armchair', x: 184, y: 311, facing: 'north' },
    ],
    props: cafeProps,
    npcs: cafeNpcs,
    blockedRects: [],
  },
  {
    id: 'public-workspace',
    name: 'Office',
    width: 272,
    height: 176,
    floorTile: 'carpet',
    wallTile: 'wall-cream',
    spawn: { x: 136, y: 140 },
    seats: [
      { id: 'workspace-chair-a', propName: 'office-chair', x: 73, y: 113, facing: 'south' },
      { id: 'workspace-chair-b', propName: 'office-chair', x: 142, y: 113, facing: 'south' },
    ],
    props: workspaceProps,
    blockedRects: [],
  },
];

export const PUBLIC_ROOMS = ROOM_DEFINITIONS;

export function isPublicRoom(roomId: string): boolean {
  return PUBLIC_ROOMS.some((room) => room.id === roomId);
}

export function hasRoom(roomId: string): boolean {
  return ROOM_DEFINITIONS.some((room) => room.id === roomId);
}

export function resolveRoomDefinition(roomId: string): RoomDefinition | null {
  return ROOM_DEFINITIONS.find((room) => room.id === roomId) ?? null;
}
