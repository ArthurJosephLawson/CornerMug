import { Armchair } from 'lucide-react';
import type { SeatAnchor } from '@/types/engine.types';

export interface SeatPromptBadgeProps {
  seat: SeatAnchor | null;
  /** When set, tapping the badge sits down (touch and mouse friendly). */
  onPress?: () => void;
}

export function SeatPromptBadge({ seat, onPress }: SeatPromptBadgeProps) {
  if (!seat) return null;

  const content = (
    <>
      <Armchair className="h-4 w-4 text-lavender" />
      {onPress ? 'Tap' : 'Press'}{' '}
      {!onPress && <kbd className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">E</kbd>}
      to sit
      <span className="text-ivory/50">· {seat.propName.replace('-', ' ')}</span>
    </>
  );

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      {onPress ? (
        <button
          type="button"
          onClick={onPress}
          className="flex items-center gap-2 rounded-full bg-charcoal/85 px-4 py-2 text-xs font-semibold text-ivory shadow-card backdrop-blur transition-colors active:bg-charcoal"
        >
          {content}
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-full bg-charcoal/85 px-4 py-2 text-xs font-semibold text-ivory shadow-card backdrop-blur">
          {content}
        </div>
      )}
    </div>
  );
}