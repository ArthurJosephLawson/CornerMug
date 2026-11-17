import { useCallback, useEffect, useState } from 'react';
import { Check, Clock, UserPlus, Users, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import {
  acceptRequest,
  addFriend,
  declineRequest,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  listPlayers,
  removeFriend,
  type FriendRequest,
  type FriendWithStatus,
} from '@/services/friendService';
import type { PublicProfile } from '@/types/database.types';
import { AddFriendBar } from '@/components/friends/AddFriendBar';
import { FriendCard } from '@/components/friends/FriendCard';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function FriendsPage() {
  const { profile } = useAuth();
  const [friends, setFriends] = useState<FriendWithStatus[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [players, setPlayers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [friendRows, incomingRows, outgoingRows, playerRows] = await Promise.all([
        listFriends(profile.id),
        listIncomingRequests(profile.id),
        listOutgoingRequests(profile.id),
        listPlayers(),
      ]);
      setFriends(friendRows);
      setIncoming(incomingRows);
      setOutgoing(outgoingRows);
      setPlayers(playerRows);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load friends.', 'error');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleRemove = async (friendshipId: string) => {
    if (!profile) return;
    try {
      await removeFriend(profile.id, friendshipId);
      showToast('Friend removed.', 'success');
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not remove friend.', 'error');
    }
  };

  const handleAccept = async (friendshipId: string, username: string) => {
    if (!profile) return;
    try {
      await acceptRequest(profile.id, friendshipId);
      showToast(`${username} is now your friend.`, 'success');
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not accept request.', 'error');
    }
  };

  const handleDecline = async (friendshipId: string, username: string) => {
    if (!profile) return;
    try {
      await declineRequest(profile.id, friendshipId);
      showToast(`Request from ${username} declined.`, 'info');
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not decline request.', 'error');
    }
  };

  const handleAddPlayer = async (player: PublicProfile) => {
    if (!profile) return;
    try {
      await addFriend(profile.id, player);
      showToast(`Friend request sent to ${player.username}.`, 'success');
      await loadAll();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send request.', 'error');
    }
  };

  const hiddenIds = new Set<string>([
    profile?.id ?? '',
    ...friends.map((friend) => friend.id),
    ...incoming.map((request) => request.profile.id),
    ...outgoing.map((request) => request.profile.id),
  ]);
  const recommendations = players.filter((player) => !hiddenIds.has(player.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Friends</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          See who is online, answer requests, and meet other players.
        </p>
      </div>

      <Card>
        <AddFriendBar onAdded={() => void loadAll()} />
      </Card>

      {loading ? (
        <p className="py-8 text-center text-sm text-charcoal/45">Loading friends...</p>
      ) : (
        <>
          {incoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-bold">Friend requests</h2>
              {incoming.map((request) => (
                <div
                  key={request.friendshipId}
                  className="flex items-center gap-3 rounded-2xl border border-lavender/40 bg-lavender/30 p-3 shadow-soft"
                >
                  <AvatarPreview slug={request.profile.avatar_slug} size={44} className="rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{request.profile.username}</p>
                    <p className="text-xs text-charcoal/50">wants to be your friend</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleAccept(request.friendshipId, request.profile.username)}
                  >
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleDecline(request.friendshipId, request.profile.username)}
                    aria-label={`Decline ${request.profile.username}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </section>
          ) : null}

          {outgoing.length > 0 ? (
            <section className="space-y-2">
              <h2 className="text-lg font-bold">Sent requests</h2>
              {outgoing.map((request) => (
                <div
                  key={request.friendshipId}
                  className="flex items-center gap-2 rounded-2xl border border-charcoal/5 bg-white/70 p-3 text-sm shadow-soft"
                >
                  <Clock className="h-4 w-4 text-charcoal/40" />
                  <span className="font-semibold">{request.profile.username}</span>
                  <span className="text-xs text-charcoal/50">waiting for a reply</span>
                </div>
              ))}
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Your friends</h2>
            {friends.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 py-10 text-center">
                <Users className="h-8 w-8 text-charcoal/25" />
                <p className="text-sm font-semibold">No friends yet</p>
                <p className="text-xs text-charcoal/50">
                  Add someone by their exact username above, or pick a player below.
                </p>
              </Card>
            ) : (
              friends.map((friend) => (
                <FriendCard
                  key={friend.friendshipId}
                  friend={friend}
                  onRemove={(id) => void handleRemove(id)}
                />
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold">Players on CornerMug</h2>
            {recommendations.length === 0 ? (
              <Card className="flex flex-col items-center gap-2 py-8 text-center">
                <UserPlus className="h-8 w-8 text-charcoal/25" />
                <p className="text-sm text-charcoal/55">No other players to meet yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((player) => (
                  <Card key={player.id} className="flex items-center gap-3 p-3">
                    <AvatarPreview slug={player.avatar_slug} size={40} className="rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{player.username}</p>
                      <p className="text-xs text-charcoal/50">player</p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void handleAddPlayer(player)}
                      aria-label={`Add ${player.username} as friend`}
                    >
                      <UserPlus className="h-4 w-4" /> Add
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
