import { useState, type FormEvent } from 'react';
import { Copy, KeyRound, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { createPrivateRoom, findRoomByKey } from '@/services/roomService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

type Tab = 'create' | 'join';

export interface PrivateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onJoined: (roomId: string, roomName: string) => void;
}

export function PrivateRoomModal({ open, onClose, onJoined }: PrivateRoomModalProps) {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('create');
  const [name, setName] = useState('');
  const [joinKey, setJoinKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setJoinKey('');
    setCreatedKey(null);
    setBusy(false);
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    try {
      const room = await createPrivateRoom(profile.id, name.trim() || 'Private Room');
      setCreatedKey(room.room_key ?? room.id);
      showToast('Private room created.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not create room.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const room = await findRoomByKey(joinKey.trim());
      if (!room) {
        showToast('No room found with that key.', 'error');
        return;
      }
      onJoined(room.id, room.name);
      onClose();
      reset();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not join room.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        reset();
      }}
      title="Private space"
    >
      <div className="flex rounded-full bg-charcoal/5 p-1 text-sm font-semibold">
        {(['create', 'join'] as Tab[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setTab(option)}
            className={`flex-1 rounded-full px-3 py-1.5 transition-colors ${
              tab === option ? 'bg-white shadow-soft' : 'text-charcoal/55 hover:text-charcoal'
            }`}
          >
            {option === 'create' ? 'Create' : 'Join'}
          </button>
        ))}
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Room name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Study nook"
            maxLength={40}
          />
          {createdKey ? (
            <div className="rounded-xl border border-sage-deep/30 bg-sage/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Share this key
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold tracking-wider">{createdKey}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard?.writeText(createdKey);
                    showToast('Room key copied.', 'success');
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  onJoined(createdKey, name.trim() || 'Private Room');
                  onClose();
                  reset();
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Enter my room
              </Button>
            </div>
          ) : null}
          <Button type="submit" loading={busy} className="w-full">
            <Plus className="h-4 w-4" /> Generate room key
          </Button>
        </form>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Room key"
            value={joinKey}
            onChange={(event) => setJoinKey(event.target.value.toUpperCase())}
            placeholder="COZY-7X2"
            icon={<KeyRound className="h-4 w-4" />}
            maxLength={16}
          />
          <Button type="submit" loading={busy} className="w-full">
            Join room
          </Button>
        </form>
      )}
    </Modal>
  );
}
