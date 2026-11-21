import { supabase } from '@/lib/supabaseClient';

export type ShopItemId = 'kitten' | 'money-250' | 'money-600' | 'money-1500';

export interface ProgressSnapshot {
  xp: number;
  money: number;
  owned_items: string[];
}

export interface AwardResult extends ProgressSnapshot {
  gained: number;
  seconds: number;
}

export interface PurchaseResult extends ProgressSnapshot {
  spent: number;
  already_owned: boolean;
}

export interface RefundResult extends ProgressSnapshot {
  refunded: number;
  deducted_money: number;
  item: string;
}

function parseProgress(payload: unknown): ProgressSnapshot {
  const row = (payload ?? {}) as Record<string, unknown>;
  const owned = Array.isArray(row.owned_items)
    ? row.owned_items.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    xp: Number(row.xp ?? 0),
    money: Number(row.money ?? 0),
    owned_items: owned,
  };
}

/**
 * Award XP for time spent in a room. The server owns the XP rate, so the
 * browser only reports elapsed seconds. Throws when the progress migration has
 * not been applied yet; callers fall back to plain stats in that case.
 */
export async function awardHangout(seconds: number): Promise<AwardResult> {
  const rounded = Math.max(0, Math.floor(seconds));
  if (rounded === 0) {
    return { xp: 0, money: 0, owned_items: [], gained: 0, seconds: 0 };
  }

  const { data, error } = await supabase.rpc('award_hangout', { p_seconds: rounded });
  if (error) throw new Error(error.message);

  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ...progress,
    gained: Number(row.gained ?? 0),
    seconds: Number(row.seconds ?? rounded),
  };
}

/** Buy a shop item. Prices and coin amounts are validated inside the RPC. */
export async function purchaseItem(item: ShopItemId): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc('purchase_item', { p_item: item });
  if (error) throw new Error(error.message);

  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ...progress,
    spent: Number(row.spent ?? 0),
    already_owned: row.already_owned === true,
  };
}

/** Return a bought item or money pack and get its XP price back. */
export async function refundItem(item: ShopItemId): Promise<RefundResult> {
  const { data, error } = await supabase.rpc('refund_item', { p_item: item });
  if (error) throw new Error(error.message);

  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ...progress,
    refunded: Number(row.refunded ?? 0),
    deducted_money: Number(row.deducted_money ?? 0),
    item: String(row.item ?? item),
  };
}

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  priceXp: number;
  kind: 'unlock' | 'money';
  moneyAmount?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'kitten',
    name: 'Kitten',
    description: 'A tiny orange tabby that follows you around every room.',
    priceXp: 350,
    kind: 'unlock',
  },
  {
    id: 'money-250',
    name: 'Pocket money',
    description: 'Add 250 money to your wallet.',
    priceXp: 100,
    kind: 'money',
    moneyAmount: 250,
  },
  {
    id: 'money-600',
    name: 'Coin jar',
    description: 'Add 600 money to your wallet.',
    priceXp: 200,
    kind: 'money',
    moneyAmount: 600,
  },
  {
    id: 'money-1500',
    name: 'Savings tin',
    description: 'Add 1500 money to your wallet.',
    priceXp: 450,
    kind: 'money',
    moneyAmount: 1500,
  },
];
