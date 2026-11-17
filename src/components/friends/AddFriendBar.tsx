import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { addFriend, findProfileByUsername } from '@/services/friendService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface AddFriendBarProps {
  onAdded: () => void;
}

export function AddFriendBar({ onAdded }: AddFriendBarProps) {
  const { profile } = useAuth();
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || busy || !username.trim()) return;
    setBusy(true);
    try {
      const found = await findProfileByUsername(username);
      if (!found) {
        showToast('No player found with that username.', 'error');
        return;
      }
      await addFriend(profile.id, found);
      showToast(`Friend request sent to ${found.username}.`, 'success');
      setUsername('');
      onAdded();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not add friend.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <div className="flex-1">
        <Input
          label="Add by username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="e.g. quietfox"
          icon={<UserPlus className="h-4 w-4" />}
          maxLength={24}
        />
      </div>
      <Button type="submit" loading={busy} className="sm:self-end">
        Add friend
      </Button>
    </form>
  );
}
