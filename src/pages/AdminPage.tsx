import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Pencil, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import {
  getUserPassword,
  listUsers,
  removeUser,
  renameUser,
  setAdmin,
  type AdminUserRow,
} from '@/services/adminService';
import { AdminTerminal } from '@/components/admin/AdminTerminal';
import { Card } from '@/components/ui/Card';

function formatDate(value: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [passwordBusyId, setPasswordBusyId] = useState<string | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});

  const isAdmin = profile?.is_admin === true;
  const isOwner = profile?.is_owner === true;

  const load = useCallback(async () => {
    if (!profile?.is_admin) return;
    setLoading(true);
    try {
      setUsers(await listUsers());
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRemove = async (user: AdminUserRow) => {
    const confirmed = window.confirm(
      `Remove ${user.username}? This deletes their account permanently.`,
    );
    if (!confirmed) return;

    setRemovingId(user.id);
    try {
      await removeUser(user.id);
      showToast(`${user.username} removed.`, 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not remove user.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleRole = async (user: AdminUserRow, makeAdmin: boolean) => {
    const confirmed = window.confirm(
      makeAdmin
        ? `Make ${user.username} an admin? Admins can manage players.`
        : `Remove admin rights from ${user.username}?`,
    );
    if (!confirmed) return;

    setRoleBusyId(user.id);
    try {
      await setAdmin(user.id, makeAdmin);
      showToast(
        makeAdmin ? `${user.username} is now an admin.` : `${user.username} is no longer an admin.`,
        'success',
      );
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not change role.', 'error');
    } finally {
      setRoleBusyId(null);
    }
  };

  const handleRename = async (user: AdminUserRow) => {
    const next = window.prompt(`New username for ${user.username}:`, user.username);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed || trimmed === user.username) return;

    setRenamingId(user.id);
    try {
      await renameUser(user.id, trimmed);
      showToast(`${user.username} renamed to ${trimmed}.`, 'success');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not rename user.', 'error');
    } finally {
      setRenamingId(null);
    }
  };

  const handlePassword = async (user: AdminUserRow) => {
    if (revealedPasswords[user.id] !== undefined) {
      setRevealedPasswords((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
      return;
    }

    setPasswordBusyId(user.id);
    try {
      const password = await getUserPassword(user.id);
      setRevealedPasswords((current) => ({ ...current, [user.id]: password }));
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not read password.', 'error');
    } finally {
      setPasswordBusyId(null);
    }
  };

  if (!profile || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Shield className="h-6 w-6 text-lavender-deep" />
          Admin
        </h1>
        <p className="mt-1 text-sm text-charcoal/55">
          {users.length} registered {users.length === 1 ? 'player' : 'players'}. The terminal can
          grant XP, money, items, roles, renames, and removals.
        </p>
      </div>

      <AdminTerminal
        users={users}
        selfId={profile.id}
        isOwner={isOwner}
        onRefresh={load}
      />

      <div className="rounded-2xl border border-butter-deep/30 bg-butter/25 px-4 py-3 text-xs leading-relaxed text-charcoal/70">
        Passwords are stored as plaintext sign-in keys so email + username login works. Only the
        owner can reveal them. Use the terminal <code className="font-mono">/password @name</code>{' '}
        or the eye button on a player row.
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-charcoal/45">Loading players...</p>
      ) : users.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Shield className="h-8 w-8 text-charcoal/25" />
          <p className="text-sm font-semibold">No players found</p>
          <p className="text-xs text-charcoal/50">New sign-ups will appear here.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <ul className="divide-y divide-charcoal/8">
            {users.map((user) => {
              const isSelf = user.id === profile.id;
              const isRemoving = removingId === user.id;
              const isRoleBusy = roleBusyId === user.id;
              const isRenaming = renamingId === user.id;
              const isPasswordBusy = passwordBusyId === user.id;
              const revealed = revealedPasswords[user.id];
              const canManage = isOwner && !user.is_owner && !isSelf;
              const removeBlocked = isSelf || user.is_owner || (user.is_admin && !isOwner);

              return (
                <li key={user.id} className="px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <span className="truncate">{user.username}</span>
                        {isSelf ? (
                          <span className="rounded-full bg-butter px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">
                            you
                          </span>
                        ) : null}
                        {user.is_owner ? (
                          <span className="rounded-full bg-charcoal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ivory">
                            owner
                          </span>
                        ) : user.is_admin ? (
                          <span className="rounded-full bg-lavender px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">
                            admin
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-charcoal/50">
                        {user.email} · joined {formatDate(user.created_at)}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-charcoal/45">
                        {user.xp.toLocaleString()} XP · {user.money.toLocaleString()} money ·{' '}
                        {user.owned_items.length} items
                      </p>
                      {revealed !== undefined ? (
                        <p className="mt-1 flex items-center gap-1.5 rounded-lg bg-charcoal/5 px-2 py-1 font-mono text-[11px] text-charcoal">
                          <KeyRound className="h-3 w-3 shrink-0 text-charcoal/45" />
                          {revealed || '(empty)'}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {isOwner ? (
                        <button
                          type="button"
                          disabled={isPasswordBusy}
                          onClick={() => void handlePassword(user)}
                          className="flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors enabled:hover:bg-charcoal/5 disabled:opacity-40"
                          title={revealed !== undefined ? 'Hide password' : 'Reveal password'}
                        >
                          {revealed !== undefined ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {revealed !== undefined ? 'Hide' : 'Password'}
                        </button>
                      ) : null}

                      {canManage ? (
                        <button
                          type="button"
                          disabled={isRoleBusy}
                          onClick={() => void handleRole(user, !user.is_admin)}
                          className="flex items-center gap-1.5 rounded-full border border-lavender-deep/30 bg-lavender/40 px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors enabled:hover:bg-lavender/70 disabled:opacity-40"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {isRoleBusy ? 'Saving...' : user.is_admin ? 'Remove admin' : 'Make admin'}
                        </button>
                      ) : null}

                      {!user.is_owner ? (
                        <button
                          type="button"
                          disabled={isRenaming}
                          onClick={() => void handleRename(user)}
                          className="flex items-center gap-1.5 rounded-full border border-charcoal/15 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors enabled:hover:bg-charcoal/5 disabled:opacity-40"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {isRenaming ? 'Renaming...' : 'Rename'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={removeBlocked || isRemoving}
                        onClick={() => void handleRemove(user)}
                        className="flex items-center gap-1.5 rounded-full border border-pink-deep/40 bg-pink/60 px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors enabled:hover:bg-pink disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          user.is_owner
                            ? 'The owner account cannot be removed'
                            : user.is_admin && !isOwner
                              ? 'Only the owner can remove an admin'
                              : 'Remove player'
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {isRemoving ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
