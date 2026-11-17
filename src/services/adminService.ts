import { supabase } from '@/lib/supabaseClient';

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  avatar_slug: string;
  is_admin: boolean;
  last_seen_at: string;
  created_at: string;
}

export async function listUsers(): Promise<AdminUserRow[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, username, avatar_slug, is_admin, last_seen_at, created_at')
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
