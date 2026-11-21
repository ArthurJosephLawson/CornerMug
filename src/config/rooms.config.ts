import type { RoomDefinition } from '@/types/engine.types';

// All existing rooms removed by request; maps will be added later.
export const ROOM_DEFINITIONS: RoomDefinition[] = [];
export const PUBLIC_ROOMS: RoomDefinition[] = [];

export function isPublicRoom(_roomId: string): boolean {
  return false;
}

export function hasRoom(roomId: string): boolean {
  return ROOM_DEFINITIONS.some((room) => room.id === roomId);
}

export function resolveRoomDefinition(roomId: string): RoomDefinition | null {
  return ROOM_DEFINITIONS.find((room) => room.id === roomId) ?? null;
}
