import { supabase } from '@/lib/supabaseClient';
import type { PublicProfile } from '@/types/database.types';
import { formatRelative } from '@/lib/formatTime';

export interface FriendWithStatus extends PublicProfile {
  friendshipId: string;
  createdAt: string;
  online: boolean;
  lastSeenLabel: string;
}

export interface FriendRequest {
  friendshipId: string;
  createdAt: string;
  profile: PublicProfile;
}

const PROFILE_FIELDS = 'id, username, avatar_slug, last_seen_at';

function mapProfile(row: Record<string, unknown>): PublicProfile {
  return {
    id: String(row.id),
    username: String(row.username),
    avatar_slug: row.avatar_slug as PublicProfile['avatar_slug'],
    last_seen_at: String(row.last_seen_at ?? ''),
  };
}

function toFriend(row: Record<string, unknown>, profile: Record<string, unknown>): FriendWithStatus {
  const mapped = mapProfile(profile);
  const lastSeenMs = mapped.last_seen_at ? new Date(mapped.last_seen_at).getTime() : 0;
  return {
    ...mapped,
    friendshipId: String(row.id),
    createdAt: String(row.created_at ?? ''),
    online: Number.isFinite(lastSeenMs) && Date.now() - lastSeenMs < 60_000,
    lastSeenLabel: mapped.last_seen_at ? formatRelative(mapped.last_seen_at) : 'offline',
  };
}

/** Accepted friendships in both directions (they added me, or I added them). */
export async function listFriends(userId: string): Promise<FriendWithStatus[]> {
  const [sent, received] = await Promise.all([
    supabase
      .from('friends')
      .select(`id, status, created_at, profiles!friends_friend_id_fkey(${PROFILE_FIELDS})`)
      .eq('user_id', userId)
      .eq('status', 'accepted'),
    supabase
      .from('friends')
      .select(`id, status, created_at, profiles!friends_user_id_fkey(${PROFILE_FIELDS})`)
      .eq('friend_id', userId)
      .eq('status', 'accepted'),
  ]);

  if (sent.error) throw new Error(sent.error.message);
  if (received.error) throw new Error(received.error.message);

  const friends = new Map<string, FriendWithStatus>();
  for (const row of (sent.data ?? []) as Array<Record<string, unknown>>) {
    const profile = mapProfile((row.profiles ?? {}) as Record<string, unknown>);
    if (!profile.id) continue;
    friends.set(profile.id, toFriend(row, row.profiles as Record<string, unknown>));
  }
  for (const row of (received.data ?? []) as Array<Record<string, unknown>>) {
    const profile = mapProfile((row.profiles ?? {}) as Record<string, unknown>);
    if (!profile.id) continue;
    if (!friends.has(profile.id)) {
      friends.set(profile.id, toFriend(row, row.profiles as Record<string, unknown>));
    }
  }
  return [...friends.values()];
}

/** Requests other players sent me. */
export async function listIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friends')
    .select(`id, created_at, profiles!friends_user_id_fkey(${PROFILE_FIELDS})`)
    .eq('friend_id', userId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => row.profiles)
    .map((row) => ({
      friendshipId: String(row.id),
      createdAt: String(row.created_at ?? ''),
      profile: mapProfile(row.profiles as Record<string, unknown>),
    }));
}

/** Requests I sent that are still waiting. */
export async function listOutgoingRequests(userId: string): Promise<FriendRequest[]> {
  const { data, error } = await supabase
    .from('friends')
    .select(`id, created_at, profiles!friends_friend_id_fkey(${PROFILE_FIELDS})`)
    .eq('user_id', userId)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>)
    .filter((row) => row.profiles)
    .map((row) => ({
      friendshipId: String(row.id),
      createdAt: String(row.created_at ?? ''),
      profile: mapProfile(row.profiles as Record<string, unknown>),
    }));
}

/** Every player on CornerMug, most recently active first. */
export async function listPlayers(): Promise<PublicProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .order('last_seen_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapProfile);
}

export async function findProfileByUsername(username: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_FIELDS)
    .ilike('username', username.trim())
    .maybeSingle();

  if (error || !data) return null;
  return mapProfile(data as Record<string, unknown>);
}

/**
 * Send a friend request. If the other player already sent us one, accept
 * theirs instead so we never end up with two pending rows.
 */
export async function addFriend(userId: string, friend: PublicProfile): Promise<void> {
  if (friend.id === userId) {
    throw new Error('You cannot add yourself as a friend.');
  }

  const { data: existing, error: lookupError } = await supabase
    .from('friends')
    .select('id, status, user_id, friend_id')
    .or(`and(user_id.eq.${userId},friend_id.eq.${friend.id}),and(user_id.eq.${friend.id},friend_id.eq.${userId})`)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);

  if (existing) {
    const row = existing as Record<string, unknown>;
    if (row.status === 'accepted') {
      throw new Error(`${friend.username} is already your friend.`);
    }
    // Inverse pending request: accept it outright.
    const { error: acceptError } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', String(row.id));
    if (acceptError) throw new Error(acceptError.message);
    return;
  }

  const { error } = await supabase.from('friends').insert({
    user_id: userId,
    friend_id: friend.id,
    status: 'pending',
  });
  if (error) throw new Error(error.message);
}

export async function acceptRequest(userId: string, friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', friendshipId)
    .eq('friend_id', userId);
  if (error) throw new Error(error.message);
}

export async function declineRequest(userId: string, friendshipId: string): Promise<void> {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', friendshipId)
    .eq('friend_id', userId);
  if (error) throw new Error(error.message);
}

export async function removeFriend(_userId: string, friendshipId: string): Promise<void> {
  // RLS limits the delete to rows we are part of.
  const { error } = await supabase.from('friends').delete().eq('id', friendshipId);
  if (error) throw new Error(error.message);
}
