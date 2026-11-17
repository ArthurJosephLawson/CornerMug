import { ArrowLeft, Copy, Users, Wifi, WifiOff } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { showToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';

export interface RoomTopBarProps {
  roomName: string;
  roomKey?: string | null;
  occupantCount: number;
  /** Shown as "n / capacity" when set. */
  capacity?: number;
  /** Which table (shard) of the room map this client is sitting at. */
  tableNumber?: number;
  connected: boolean;
  onLeave: () => void;
}

export function RoomTopBar({
  roomName,
  roomKey,
  occupantCount,
  capacity,
  tableNumber,
  connected,
  onLeave,
}: RoomTopBarProps) {
  const { settings } = useSettings();

  const copyKey = async () => {
    if (!roomKey) return;
    try {
      await navigator.clipboard.writeText(roomKey);
      if (settings.uiChimes) showToast('Room key copied.', 'success');
    } catch {
      showToast(roomKey, 'info');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-charcoal px-4 py-3 text-ivory shadow-card">
      <button
        type="button"
        onClick={onLeave}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-ivory/70 transition-colors hover:bg-white/10 hover:text-ivory"
      >
        <ArrowLeft className="h-4 w-4" /> Leave
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold">{roomName}</h1>
        {roomKey ? (
          <button
            type="button"
            onClick={copyKey}
            className="mt-0.5 flex items-center gap-1 font-mono text-xs text-ivory/60 hover:text-ivory"
          >
            {roomKey} <Copy className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {tableNumber ? (
          <span className="pill bg-lavender/30 text-lavender">Table #{tableNumber}</span>
        ) : null}
        <span className="pill bg-white/10 text-ivory">
          <Users className="h-3.5 w-3.5" /> {occupantCount}
          {capacity ? ` / ${capacity}` : ''}
        </span>
        <span
          className={`pill ${connected ? 'bg-sage/30 text-sage' : 'bg-pink/30 text-pink'}`}
          title={connected ? 'Realtime connected' : 'Reconnecting...'}
        >
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? 'Live' : 'Offline'}
        </span>
        <Button variant="secondary" size="sm" onClick={onLeave}>
          Dashboard
        </Button>
      </div>
    </div>
  );
}
