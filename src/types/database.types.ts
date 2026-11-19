export type AvatarSlug =
  | 'resident'
  | 'barista'
  | 'cook'
  | 'courier'
  | 'maintenance-worker'
  | 'office-worker';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  user_key: string;
  avatar_slug: AvatarSlug;
  is_admin: boolean;
  is_owner: boolean;
  last_seen_at: string;
  created_at: string;
  /** Progress features. Defaults keep older accounts working before migration. */
  xp: number;
  money: number;
  owned_items: string[];
}

export interface RoomRow {
  id: string;
  name: string;
  is_public: boolean;
  room_key: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface FriendRow {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export type FeedbackCategory = 'bug' | 'feature' | 'review' | 'general';

export interface FeedbackRow {
  id: string;
  user_id: string | null;
  category: FeedbackCategory;
  subject: string | null;
  message: string;
  created_at: string;
}

export interface UserStatsRow {
  user_id: string;
  focus_minutes: number;
  hangout_seconds: number;
  sessions_completed: number;
  updated_at: string;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatar_slug: AvatarSlug;
  last_seen_at: string;
}
