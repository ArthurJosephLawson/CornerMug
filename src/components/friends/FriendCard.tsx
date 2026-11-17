import { Trash2 } from 'lucide-react';
import type { FriendWithStatus } from '@/services/friendService';
import { AvatarPreview } from '@/components/ui/AvatarPreview';
import { Button } from '@/components/ui/Button';

export interface FriendCardProps {
  friend: FriendWithStatus;
  onRemove: (friendshipId: string) => void;
}

export function FriendCard({ friend, onRemove }: FriendCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-charcoal/5 bg-white/70 p-3 shadow-soft">
      <div className="relative">
        <AvatarPreview slug={friend.avatar_slug} size={44} className="rounded-xl" />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ivory ${
            friend.online ? 'bg-sage-deep' : 'bg-charcoal/25'
          }`}
          aria-label={friend.online ? 'Online' : 'Offline'}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{friend.username}</p>
        <p className="text-xs text-charcoal/50">
          {friend.online ? 'Online now' : friend.lastSeenLabel}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(friend.friendshipId)} aria-label={`Remove ${friend.username}`}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
