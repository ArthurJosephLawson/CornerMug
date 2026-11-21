import type { RoomDefinition } from '@/types/engine.types';

// Maps from main-characters-home-free-top-down-pixel-art-asset.zip (Craftpix).
// Rendered from Tiled_files/*.tmx into static background images.

const homeMaps = {
  exterior: '/assets/added/main-characters-home/exterior-map.png',
  interior: '/assets/added/main-characters-home/interior-map.png',
} as const;

export const ROOM_DEFINITIONS: RoomDefinition[] = [
  {
    id: 'public-exterior',
    name: 'Exterior',
    width: 768,
    height: 512,
    floorTile: 'paving',
    wallTile: 'wall-cream',
    backgroundImage: homeMaps.exterior,
    spawn: { x: 384, y: 430 },
    seats: [],
    props: [],
    blockedRects: [],
  },
  {
    id: 'public-interior',
    name: 'Interior',
    width: 768,
    height: 512,
    floorTile: 'oak-floor',
    wallTile: 'wall-cream',
    backgroundImage: homeMaps.interior,
    spawn: { x: 384, y: 430 },
    seats: [],
    props: [],
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
