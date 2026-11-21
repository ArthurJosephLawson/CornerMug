import { Coins, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ProgressSnapshot } from '@/services/progressService';

export interface NpcMenuItem {
  id: string;
  name: string;
  priceMoney: number;
  image: string;
}

export interface NpcMenuBubbleProps {
  open: boolean;
  npcName: string;
  items: NpcMenuItem[];
  ownedItems: string[];
  money: number;
  x: number;
  y: number;
  busyId?: string | null;
  onClose: () => void;
  onBuy: (itemId: string) => void;
}

export function NpcMenuBubble({
  open,
  npcName,
  items,
  ownedItems,
  money,
  x,
  y,
  busyId = null,
  onClose,
  onBuy,
}: NpcMenuBubbleProps) {
  if (!open) return null;

  return (
    <div
      className="pointer-events-auto absolute z-40 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2"
      style={{ left: x, top: Math.max(8, y - 16) }}
    >
      <div className="rounded-2xl border border-charcoal/10 bg-[#fffaf0] p-3 shadow-card dark:border-white/10 dark:bg-[#1f1f29]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45 dark:text-white/45">
              {npcName}&apos;s counter
            </p>
            <p className="text-sm font-bold">Treats menu</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => {
            const owned = ownedItems.includes(item.id);
            const affordable = money >= item.priceMoney;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-charcoal/10 bg-white/70 p-2 dark:border-white/10 dark:bg-white/5"
              >
                <img
                  src={item.image}
                  alt=""
                  className="mx-auto h-14 w-14 object-contain [image-rendering:pixelated]"
                />
                <p className="mt-1 text-center text-xs font-semibold leading-tight">{item.name}</p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold text-charcoal/60 dark:text-white/60">
                  <Coins className="h-3 w-3 text-butter-deep" /> {item.priceMoney}
                </p>
                <Button
                  variant={owned ? 'outline' : 'secondary'}
                  size="sm"
                  className="mt-2 w-full px-2 py-1 text-[11px]"
                  disabled={owned || !affordable || busyId !== null}
                  loading={busyId === item.id}
                  onClick={() => onBuy(item.id)}
                >
                  {owned ? 'Owned' : affordable ? 'Buy' : 'Need money'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mx-auto h-0 w-0 border-x-8 border-t-8 border-x-transparent border-t-[#fffaf0] dark:border-t-[#1f1f29]" />
    </div>
  );
}

export type { ProgressSnapshot };
