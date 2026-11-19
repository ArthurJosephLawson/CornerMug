import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authService from '@/services/authService';
import { clearSession, readSession, writeSession } from '@/lib/localStorage';
import type { AvatarSlug, UserProfile } from '@/types/database.types';

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, username: string, avatarSlug: AvatarSlug) => Promise<UserProfile>;
  signIn: (email: string, username: string, userKey: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  setAvatar: (avatarSlug: AvatarSlug) => Promise<void>;
  /** Re-read the profile row (XP, money, owned items) from the database. */
  refreshProfile: () => Promise<void>;
  /** Apply a progress snapshot returned by a shop / XP RPC. */
  applyProgress: (update: ProgressUpdate) => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export interface ProgressUpdate {
  xp?: number;
  money?: number;
  owned_items?: string[];
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toStoredSession(profile: UserProfile) {
  return {
    userId: profile.id,
    email: profile.email,
    username: profile.username,
    userKey: profile.user_key,
    avatarSlug: profile.avatar_slug,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const stored = readSession();
        if (!stored) {
          setLoading(false);
          return;
        }
        const restored = await authService.restoreSession();
        if (cancelled) return;
        setProfile(restored);
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfile = useCallback((next: UserProfile) => {
    setProfile(next);
    writeSession(toStoredSession(next));
  }, []);

  const signUp = useCallback(
    async (email: string, username: string, avatarSlug: AvatarSlug) => {
      const next = await authService.signUpWithKey(email, username, avatarSlug);
      handleProfile(next);
      return next;
    },
    [handleProfile],
  );

  const signIn = useCallback(
    async (email: string, username: string, userKey: string) => {
      const next = await authService.signInWithKey(email, username, userKey);
      handleProfile(next);
      return next;
    },
    [handleProfile],
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    clearSession();
    setProfile(null);
  }, []);

  const setAvatar = useCallback(
    async (avatarSlug: AvatarSlug) => {
      if (!profile) return;
      await authService.updateAvatar(profile.id, avatarSlug);
      handleProfile({ ...profile, avatar_slug: avatarSlug });
    },
    [handleProfile, profile],
  );

  const refreshProfile = useCallback(async () => {
    const restored = await authService.restoreSession();
    if (restored) handleProfile(restored);
  }, [handleProfile]);

  const applyProgress = useCallback(
    (update: ProgressUpdate) => {
      setProfile((current) => {
        if (!current) return current;
        const next: UserProfile = {
          ...current,
          xp: update.xp ?? current.xp,
          money: update.money ?? current.money,
          owned_items: update.owned_items ?? current.owned_items,
        };
        writeSession(toStoredSession(next));
        return next;
      });
    },
    [],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!profile) throw new Error('Not signed in.');
      await authService.changePassword(profile.id, profile.email, currentPassword, newPassword);
      handleProfile({ ...profile, user_key: newPassword.trim() });
    },
    [handleProfile, profile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      setAvatar,
      refreshProfile,
      applyProgress,
      changePassword,
    }),
    [profile, loading, signUp, signIn, signOut, setAvatar, refreshProfile, applyProgress, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
