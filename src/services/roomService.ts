import { supabase } from '@/lib/supabaseClient';
import { PUBLIC_ROOMS } from '@/config/rooms.config';
import { generateRoomKey } from '@/lib/keyGenerator';
import type { RoomRow } from '@/types/database.types';

function mapRoom(row: Record<string, unknown>): RoomRow {
  return {
    id: String(row.id),
    name: String(row.name),
    is_public: Boolean(row.is_public),
    room_key: row.room_key ? String(row.room_key) : null,
    owner_id: row.owner_id ? String(row.owner_id) : null,
    created_at: String(row.created_at ?? ''),
  };
}

/**
 * The public room catalog is authored in code — always exactly the three
 * public rooms, never whatever private rooms players have created. Private
 * rooms are reached through their shared key (findRoomByKey), not this list.
 */
export async function listRooms(): Promise<RoomRow[]> {
  return PUBLIC_ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    is_public: true,
    room_key: null,
    owner_id: null,
    created_at: '',
  }));
}

/** Creates a shareable private room key. Rows are optional at this stage. */
export async function createPrivateRoom(ownerId: string, name = 'Private Room'): Promise<RoomRow> {
  const roomKey = generateRoomKey();

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      id: roomKey,
      name,
      is_public: false,
      room_key: roomKey,
      owner_id: ownerId,
    })
    .select('id, name, is_public, room_key, owner_id, created_at')
    .maybeSingle();

  if (error || !data) {
    // Private rooms work purely through the shared key even without a row.
    return {
      id: roomKey,
      name,
      is_public: false,
      room_key: roomKey,
      owner_id: ownerId,
      created_at: new Date().toISOString(),
    };
  }

  return mapRoom(data as Record<string, unknown>);
}

export async function findRoomByKey(roomKey: string): Promise<RoomRow | null> {
  const normalized = roomKey.trim();
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, is_public, room_key, owner_id, created_at')
    .eq('room_key', normalized)
    .maybeSingle();

  if (error || !data) return null;
  return mapRoom(data as Record<string, unknown>);
}

export async function seedPublicRooms(): Promise<void> {
  for (const room of PUBLIC_ROOMS) {
    await supabase.from('rooms').upsert(
      {
        id: room.id,
        name: room.name,
        is_public: true,
        room_key: null,
        owner_id: null,
      },
      { onConflict: 'id' },
    );
  }
}
