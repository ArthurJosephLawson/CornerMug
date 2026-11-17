import type { ChatMessage, JoinSignal, LeaveSignal, PresencePayload } from './engine.types';

export interface RealtimeEventMap {
  presence: PresencePayload;
  chat: ChatMessage;
  join: JoinSignal;
  leave: LeaveSignal;
}

export type RealtimeEventType = keyof RealtimeEventMap;

export interface NetworkPeer extends PresencePayload {
  lastSeen: number;
}

export const ROOM_CHANNEL_PREFIX = 'room:';

/**
 * Sharded room channels: each instance ("table") of a room map holds at most
 * ROOM_CAPACITY players. Shard 1 keeps the plain channel name
 * (`room:public-cafe`); overflow shards are `room:public-cafe#2`, `#3`, ...
 */
export function baseRoomId(roomId: string): string {
  const hash = roomId.lastIndexOf('#');
  if (hash === -1) return roomId;
  const suffix = roomId.slice(hash + 1);
  return suffix.length > 0 && /^\d+$/.test(suffix) ? roomId.slice(0, hash) : roomId;
}

export function roomChannelName(roomId: string, shard = 1): string {
  const suffix = shard > 1 ? `#${shard}` : '';
  return `${ROOM_CHANNEL_PREFIX}${roomId}${suffix}`;
}

export const ROOM_CAPACITY = 6;
export const MAX_ROOM_SHARDS = 10;

export const PRESENCE_STALE_MS = 15_000;
export const PRESENCE_BROADCAST_MS = 120;
export const PRESENCE_HEARTBEAT_MS = 2_000;
