import { useState } from 'react';
import { Cat, Check, Coins, Laptop, ShoppingBag, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { rankProgressForXp } from '@/lib/ranks';
import { SHOP_ITEMS, purchaseItem, type ShopItem } from '@/services/progressService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function ShopPage() {
  const { profile, applyProgress } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [migrationMissing, setMigrationMissing] = useState(false);

  if (!profile) return null;

  const progress = rankProgressForXp(profile.xp);
  const ownedItems = new Set(profile.owned_items);

  const handleBuy = async (item: ShopItem) => {
    if (busyId) return;
    setBusyId(item.id);
    try {
      const result = await purchaseItem(item.id);
      applyProgress({
        xp: result.xp,
        money: result.money,
        owned_items: result.owned_items,
      });
      if (result.already_owned) {
        showToast(`You already own the ${item.name.toLowerCase()}.`, 'info');
      } else if (item.kind === 'money') {
        showToast(`Added ${item.moneyAmount} money to your wallet.`, 'success');
      } else if (item.id === 'kitten') {
        showToast('Kitten adopted. It will follow you into every room.', 'success');
      } else {
        showToast('Laptop unlocked. Press L in a room to open it.', 'success');
      }
      setMigrationMissing(false);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Purchase failed.';
      if (/function|schema cache|does not exist|Could not find|Unknown item/i.test(message)) {
        setMigrationMissing(true);
        showToast('Shop is not ready yet: run the progress SQL migration first.', 'error');
      } else if (/Not enough XP/i.test(message)) {
        showToast('Not enough XP for that yet. Keep hanging out.', 'error');
      } else {
        showToast(message, 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">Corner shop</p>
          <h1 className="mt-1 text-2xl font-bold">Spend your study energy</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            XP comes from time in rooms. Money is your wallet balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-white text-charcoal shadow-soft">
            <Coins className="h-3.5 w-3.5 text-butter-deep" />
            <span className="font-semibold">{profile.money.toLocaleString()}</span> money
          </span>
          <span className="pill bg-charcoal text-ivory">
            <Sparkles className="h-3.5 w-3.5 text-lavender" />
            {profile.xp.toLocaleString()} XP
          </span>
        </div>
      </section>

      <Card
        className="overflow-hidden border-white/70"
        style={{ background: 'linear-gradient(120deg, #F6F1FF 0%, #FFF8EF 100%)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-charcoal shadow-soft"
              style={{ backgroundColor: `${progress.rank.color}CC` }}
            >
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
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
            <div className="h-2.5 overflow-hidden rounded-full bg-white shadow-inner">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${progress.percent}%`, backgroundColor: progress.rank.color }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] font-semibold text-charcoal/45">
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
          <span className="text-xs text-charcoal/45">{profile.xp.toLocaleString()} XP available</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SHOP_ITEMS.map((item) => {
            const owned = item.kind === 'unlock' && ownedItems.has(item.id);
            const affordable = profile.xp >= item.priceXp;
            const Icon = item.id === 'kitten' ? Cat : item.kind === 'unlock' ? Laptop : Coins;
            return (
              <Card
                key={item.id}
                className={`flex h-full flex-col gap-3 ${owned ? 'border-sage-deep/30 bg-sage/15' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      item.kind === 'unlock'
                        ? 'bg-lavender/50 text-charcoal'
                        : 'bg-butter/60 text-charcoal'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{item.name}</h3>
                      {owned ? (
                        <span className="pill bg-sage/60 text-charcoal">
                          <Check className="h-3 w-3" /> owned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-charcoal/60">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                  <span className="flex items-center gap-1.5 text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-lavender-deep" />
                    {item.priceXp} XP
                  </span>
                  <Button
                    variant={owned ? 'outline' : 'primary'}
                    size="sm"
                    disabled={owned || !affordable || busyId !== null}
                    loading={busyId === item.id}
                    onClick={() => void handleBuy(item)}
                  >
                    {owned ? 'Owned' : affordable ? 'Buy' : 'Need more XP'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="text-xs text-charcoal/45">
        Unlocks are permanent. The laptop is an in-room prop: buy it here, then press{' '}
        <kbd className="rounded bg-charcoal/5 px-1 font-mono">L</kbd> while hanging out to open or
        close it. The kitten follows you into every room.
      </p>
    </div>
  );
}
