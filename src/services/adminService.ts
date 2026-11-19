import { supabase } from '@/lib/supabaseClient';

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  avatar_slug: string;
  is_admin: boolean;
  is_owner: boolean;
  xp: number;
  money: number;
  owned_items: string[];
  last_seen_at: string;
  created_at: string;
}

export interface AdminGrantResult {
  username: string;
  xp: number;
  money: number;
  owned_items: string[];
  granted_xp: number;
  granted_money: number;
  granted_item: string | null;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as AdminUserRow[];
}

export async function removeUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_remove_user', {
    target_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function setAdmin(userId: string, makeAdmin: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', {
    target_id: userId,
    make_admin: makeAdmin,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function renameUser(userId: string, username: string): Promise<void> {
  const { error } = await supabase.rpc('admin_rename_user', {
    target_id: userId,
    new_username: username,
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Owner-only. Returns the stored sign-in password for one player. */
export async function getUserPassword(userId: string): Promise<string> {
  const { data, error } = await supabase.rpc('admin_get_password', {
    target_id: userId,
  });

  if (error) {
    throw new Error(error.message);
  }
  return String(data ?? '');
}

export interface GrantOptions {
  xp?: number;
  money?: number;
  item?: string | null;
}

export async function grantUser(
  userId: string,
  { xp = 0, money = 0, item = null }: GrantOptions,
): Promise<AdminGrantResult> {
  const { data, error } = await supabase.rpc('admin_grant', {
    target_id: userId,
    p_xp: Math.max(0, Math.floor(xp)),
    p_money: Math.max(0, Math.floor(money)),
    p_item: item,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    username: String(row.username ?? ''),
    xp: Number(row.xp ?? 0),
    money: Number(row.money ?? 0),
    owned_items: Array.isArray(row.owned_items)
      ? row.owned_items.filter((value): value is string => typeof value === 'string')
      : [],
    granted_xp: Number(row.granted_xp ?? 0),
    granted_money: Number(row.granted_money ?? 0),
    granted_item: row.granted_item === null ? null : String(row.granted_item ?? ''),
  };
}
