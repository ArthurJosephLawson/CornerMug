import { useState } from 'react';
import { Cat, Check, Coins, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { rankProgressForXp } from '@/lib/ranks';
import {
  SHOP_PAGE_ITEMS,
  purchaseItem,
  refundItem,
  type ShopItem,
} from '@/services/progressService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ShopPage() {
  const { profile, applyProgress } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  if (!profile) return null;

  const progress = rankProgressForXp(profile.xp);
  const ownedItems = new Set(profile.owned_items);

  const handleBuy = async (item: ShopItem) => {
    if (busyId || refundingId) return;
    setBusyId(item.id);
    try {
      const result = await purchaseItem(item.id);
      applyProgress({
        xp: result.xp,
        money: result.money,
        owned_items: result.owned_items,
      });
      if (result.already_owned && item.kind !== 'consumable') {
        showToast(`You already own ${item.name}.`, 'info');
      } else if (item.kind === 'money') {
        showToast(`Added ${item.moneyAmount ?? 0} money to your wallet.`, 'success');
      } else if (item.id === 'kitten') {
        showToast('Kitten adopted. It will follow you into every room.', 'success');
      } else if (item.kind === 'consumable') {
        showToast(`${item.name} eaten.`, 'success');
      } else {
        showToast(`${item.name} unlocked.`, 'success');
      }
      setMigrationMissing(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Purchase failed.';
      if (/function|schema cache|does not exist|Could not find|Unknown item/i.test(message)) {
        setMigrationMissing(true);
        showToast('Shop is not ready yet: run the updated progress SQL migration.', 'error');
      } else if (/Not enough XP/i.test(message)) {
        showToast('Not enough XP for that yet. Keep hanging out.', 'error');
      } else if (/Not enough money/i.test(message)) {
        showToast('Not enough money for that treat.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRefund = async (item: ShopItem) => {
    if (busyId || refundingId) return;
    setRefundingId(item.id);
    try {
      const result = await refundItem(item.id);
      applyProgress({
        xp: result.xp,
        money: result.money,
        owned_items: result.owned_items,
      });
      if ((result.refunded_money ?? 0) > 0) {
        showToast(`Refunded ${item.name} for ${result.refunded_money} money.`, 'success');
      } else if (result.deducted_money > 0) {
        showToast(
          `Refunded ${item.name}: -${result.deducted_money} money, +${result.refunded} XP.`,
          'success',
        );
      } else {
        showToast(`Refunded ${item.name} for ${result.refunded} XP.`, 'success');
      }
      setMigrationMissing(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Refund failed.';
      if (/function|schema cache|does not exist|Could not find/i.test(message)) {
        setMigrationMissing(true);
        showToast('Refunds are not ready yet: run the updated progress SQL migration.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45 dark:text-white/45">Corner shop</p>
          <h1 className="mt-1 text-2xl font-bold">Spend your study energy</h1>
          <p className="mt-1 text-sm text-charcoal/55 dark:text-white/60">
            XP comes from time in rooms and focus sessions. Money buys café treats.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-white text-charcoal shadow-soft dark:bg-white/10 dark:text-[#f4f1ea]">
            <Coins className="h-3.5 w-3.5 text-butter-deep" />
            <span className="font-semibold">{profile.money.toLocaleString()}</span> money
          </span>
          <span className="pill bg-charcoal text-ivory dark:bg-lavender dark:text-[#14141a]">
            <Sparkles className="h-3.5 w-3.5 text-lavender" />
            {profile.xp.toLocaleString()} XP
          </span>
        </div>
      </section>

      <Card className="overflow-hidden border-white/70 bg-[#f6f1ff] dark:border-white/10 dark:bg-[#252334]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-charcoal shadow-soft"
              style={{ backgroundColor: `${progress.rank.color}CC` }}
            >
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45 dark:text-white/45">
                {progress.rank.name} · rank {progress.rank.level}
              </p>
              <p className="font-bold">
                {progress.isMax
                  ? 'Top rank reached'
                  : `${progress.xpForNext} XP until ${progress.next?.name}`}
              </p>
            </div>
          </div>
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">
            <div className="h-2.5 overflow-hidden rounded-full bg-white shadow-inner dark:bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${progress.percent}%`, backgroundColor: progress.rank.color }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold text-charcoal/45 dark:text-white/45">
              {progress.isMax ? '500 / 500' : `${progress.xpIntoRank} / 500 XP`}
            </p>
          </div>
        </div>
      </Card>

      {migrationMissing ? (
        <div className="rounded-2xl border border-pink-deep/30 bg-pink/30 px-4 py-3 text-sm text-charcoal">
          The shop needs one setup step. Run{' '}
          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-xs">
            docs/progress-features-migration.sql
          </code>{' '}
          in the Supabase SQL editor, then reload this page.
        </div>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Items</h2>
          <span className="text-xs text-charcoal/45 dark:text-white/45">
            {profile.xp.toLocaleString()} XP · {profile.money.toLocaleString()} money
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SHOP_PAGE_ITEMS.map((item) => {
            const owned = item.kind === 'unlock' && ownedItems.has(item.id);
            const affordable = item.currency === 'money' ? profile.money >= item.price : profile.xp >= item.price;
            const refundable =
              item.kind === 'unlock'
                ? owned
                : item.kind === 'money'
                  ? profile.money >= (item.moneyAmount ?? 0)
                  : false;
            const Icon = item.id === 'kitten' ? Cat : Coins;
            return (
              <Card
                key={item.id}
                className={`flex h-full flex-col gap-3 ${owned ? 'border-sage-deep/30 bg-sage/15' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {item.image ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-butter/40 dark:bg-white/10">
                      <img src={item.image} alt="" className="h-9 w-9 object-contain [image-rendering:pixelated]" />
                    </span>
                  ) : (
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        item.kind === 'unlock'
                          ? 'bg-lavender/50 text-charcoal'
                          : 'bg-butter/60 text-charcoal'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{item.name}</h3>
                      {owned ? (
                        <span className="pill bg-sage/60 text-charcoal">
                          <Check className="h-3 w-3" /> owned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-charcoal/60 dark:text-white/60">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    {item.currency === 'money' ? (
                      <Coins className="h-4 w-4 text-butter-deep" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-lavender-deep" />
                    )}
                    {item.price} {item.currency === 'money' ? 'money' : 'XP'}
                  </span>
                  <div className="flex items-center gap-2">
                    {refundable ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId !== null || refundingId !== null}
                        loading={refundingId === item.id}
                        onClick={() => void handleRefund(item)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Refund
                      </Button>
                    ) : null}
                    <Button
                      variant={owned ? 'outline' : 'primary'}
                      size="sm"
                      disabled={owned || !affordable || busyId !== null || refundingId !== null}
                      loading={busyId === item.id}
                      onClick={() => void handleBuy(item)}
                    >
                      {owned
                        ? 'Owned'
                        : affordable
                          ? item.kind === 'consumable'
                            ? 'Eat'
                            : 'Buy'
                          : item.currency === 'money'
                            ? 'Need money'
                            : 'Need more XP'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-charcoal/45 dark:text-white/45">
        Kitten is an XP unlock. Food treats cost money and can be bought infinitely in the shop or
        from the cook in Café. Money packs cost XP and add money. Refunds return what you paid for
        refundable items.
      </p>
    </div>
  );
}
