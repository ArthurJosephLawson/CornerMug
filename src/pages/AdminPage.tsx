import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { listUsers, removeUser, type AdminUserRow } from '@/services/adminService';
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

  const isAdmin = profile?.is_admin === true;

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
          {users.length} registered {users.length === 1 ? 'player' : 'players'}. Removing a player
          deletes their account and all of their data.
        </p>
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
              return (
                <li
                  key={user.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {user.username}
                      {isSelf ? (
                        <span className="ml-2 rounded-full bg-butter px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">
                          you
                        </span>
                      ) : null}
                      {user.is_admin && !isSelf ? (
                        <span className="ml-2 rounded-full bg-lavender px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-charcoal">
                          admin
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-charcoal/50">
                      {user.email} · joined {formatDate(user.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isSelf || isRemoving}
                    onClick={() => void handleRemove(user)}
                    className="flex items-center gap-1.5 rounded-full border border-pink-deep/40 bg-pink/60 px-3 py-1.5 text-xs font-semibold text-charcoal transition-colors enabled:hover:bg-pink disabled:cursor-not-allowed disabled:opacity-40"
                    title={isSelf ? 'You cannot remove your own account here' : 'Remove player'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
