import { supabase } from '@/lib/supabaseClient';
import { generateUserKey } from '@/lib/keyGenerator';
import type { AvatarSlug, UserProfile } from '@/types/database.types';

function mapOwnedItems(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    username: String(row.username),
    user_key: String(row.user_key),
    avatar_slug: (row.avatar_slug as AvatarSlug) ?? 'resident',
    is_admin: row.is_admin === true,
    is_owner: row.is_owner === true,
    last_seen_at: String(row.last_seen_at ?? ''),
    created_at: String(row.created_at ?? ''),
    xp: Number(row.xp ?? 0),
    money: Number(row.money ?? 0),
    owned_items: mapOwnedItems(row.owned_items),
  };
}

export async function signUpWithKey(
  email: string,
  username: string,
  avatarSlug: AvatarSlug,
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  const userKey = generateUserKey();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: userKey,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Sign-up failed. Check that Confirm email is disabled or verify your inbox.');
  }
  // Supabase returns an obfuscated user (empty identities, no session) when the
  // email is already registered, instead of an error. Treat it as "sign in".
  if (!data.session) {
    const alreadyRegistered =
      Array.isArray(data.user.identities) && data.user.identities.length === 0;
    throw new Error(
      alreadyRegistered
        ? 'An account with this email already exists. Sign in with your password instead.'
        : 'Sign-up needs email confirmation. Check your inbox, or disable Confirm email in Supabase.',
    );
  }

  const { error: profileError } = await supabase.rpc('register_profile', {
    p_id: data.user.id,
    p_email: normalizedEmail,
    p_username: username.trim(),
    p_avatar_slug: avatarSlug,
    p_user_key: userKey,
  });

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    id: data.user.id,
    email: normalizedEmail,
    username: username.trim(),
    user_key: userKey,
    avatar_slug: avatarSlug,
    is_admin: false,
    is_owner: false,
    last_seen_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    xp: 0,
    money: 0,
    owned_items: [],
  };
}

export async function signInWithKey(
  email: string,
  username: string,
  userKey: string,
): Promise<UserProfile> {
  const normalizedEmail = email.trim().toLowerCase();
  let password = userKey.trim();

  let auth = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });

  // Generated keys are uppercase. Accept a lowercase typed key, but keep
  // custom passwords case-sensitive.
  const looksLikeGeneratedKey = /^mug-[a-z0-9]{4}-[a-z0-9]{4}$/i.test(password);
  if (auth.error && looksLikeGeneratedKey && password !== password.toUpperCase()) {
    password = password.toUpperCase();
    auth = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  }

  const { data, error } = auth;
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Sign-in failed. Check your email and password.');
  }

  const { data: row, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }
  if (!row) {
    throw new Error('Profile not found for this account.');
  }

  const profile = mapProfile(row as Record<string, unknown>);
  if (profile.username.toLowerCase() !== username.trim().toLowerCase()) {
    await supabase.auth.signOut();
    throw new Error('Username does not match this account.');
  }

  await touchLastSeen(profile.id);
  return profile;
}

export async function restoreSession(): Promise<UserProfile | null> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return null;

  const { data: row, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !row) return null;
  return mapProfile(row as Record<string, unknown>);
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function updateAvatar(userId: string, avatarSlug: AvatarSlug): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ avatar_slug: avatarSlug })
    .eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function touchLastSeen(userId: string): Promise<void> {
  await supabase.from('users').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
}

/**
 * Replace the generated user key with a custom password. Supabase Auth stores
 * the real credential, while `users.user_key` keeps the copy used for the
 * email + username + password sign-in check. Both must stay in sync, so a
 * failed profile write rolls the auth password back.
 */
export async function changePassword(
  userId: string,
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const trimmed = newPassword.trim();
  if (trimmed.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  if (trimmed.length > 32) {
    throw new Error('Password must be 32 characters or fewer.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: currentPassword,
  });
  if (verifyError) {
    throw new Error('Current password is not correct.');
  }

  const { error: authError } = await supabase.auth.updateUser({ password: trimmed });
  if (authError) {
    throw new Error(authError.message);
  }

  const { error: profileError } = await supabase
    .from('users')
    .update({ user_key: trimmed })
    .eq('id', userId);

  if (profileError) {
    // Keep the stored credential and the login copy aligned.
    await supabase.auth.updateUser({ password: currentPassword });
    if (profileError.code === '23505') {
      throw new Error('That password is already taken. Try another one.');
    }
    throw new Error(profileError.message);
  }
}
