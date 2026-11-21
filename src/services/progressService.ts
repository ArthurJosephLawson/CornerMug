import { supabase } from '@/lib/supabaseClient';

export type ShopItemId =
  | 'kitten'
  | 'dessert-cheesecake'
  | 'dessert-chocolate-cake'
  | 'dessert-strawberry-shortcake'
  | 'dessert-macarons'
  | 'dessert-croissant'
  | 'dessert-pancakes'
  | 'money-250'
  | 'money-600'
  | 'money-1500';

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
  currency?: 'xp' | 'money';
}

export interface RefundResult extends ProgressSnapshot {
  refunded: number;
  deducted_money: number;
  refunded_money?: number;
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

/** Award +500 XP for a completed focus session (server-authoritative). */
export async function awardFocusSession(minutes = 25): Promise<ProgressSnapshot & { gained: number }> {
  const { data, error } = await supabase.rpc('award_focus_session', {
    p_minutes: Math.max(1, Math.round(minutes)),
  });
  if (error) throw new Error(error.message);
  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return { ...progress, gained: Number(row.gained ?? 500) };
}

/** Buy a shop/menu item. Prices and currency are validated inside the RPC. */
export async function purchaseItem(item: ShopItemId): Promise<PurchaseResult> {
  const { data, error } = await supabase.rpc('purchase_item', { p_item: item });
  if (error) throw new Error(error.message);

  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ...progress,
    spent: Number(row.spent ?? 0),
    already_owned: row.already_owned === true,
    currency: row.currency === 'money' ? 'money' : 'xp',
  };
}

/** Return a bought item or money pack according to server rules. */
export async function refundItem(item: ShopItemId): Promise<RefundResult> {
  const { data, error } = await supabase.rpc('refund_item', { p_item: item });
  if (error) throw new Error(error.message);

  const progress = parseProgress(data);
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    ...progress,
    refunded: Number(row.refunded ?? row.refunded_xp ?? 0),
    deducted_money: Number(row.deducted_money ?? 0),
    refunded_money: Number(row.refunded_money ?? 0),
    item: String(row.item ?? item),
  };
}

export interface ShopItem {
  id: ShopItemId;
  name: string;
  description: string;
  price: number;
  currency: 'xp' | 'money';
  kind: 'unlock' | 'money';
  moneyAmount?: number;
  image?: string;
  soldIn: Array<'shop' | 'menu'>;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'kitten',
    name: 'Kitten',
    description: 'A tiny orange tabby that follows you around every room.',
    price: 350,
    currency: 'xp',
    kind: 'unlock',
    soldIn: ['shop'],
  },
  {
    id: 'dessert-cheesecake',
    name: 'Cheesecake Treat',
    description: 'A creamy slice for your café collection.',
    price: 200,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/Cheesecake.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'dessert-chocolate-cake',
    name: 'Chocolate Cake',
    description: 'Rich chocolate layers and a sweet unlock.',
    price: 200,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/ChocolateCake.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'dessert-strawberry-shortcake',
    name: 'Strawberry Shortcake',
    description: 'Soft sponge, cream, and strawberries.',
    price: 250,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/StrawberryShortcake.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'dessert-macarons',
    name: 'Macarons',
    description: 'A colourful box of delicate macarons.',
    price: 250,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/Macrons.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'dessert-croissant',
    name: 'Croissant',
    description: 'Buttery, flaky, and fresh from the counter.',
    price: 150,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/Croissant.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'dessert-pancakes',
    name: 'Pancakes',
    description: 'A warm stack for a cosy break.',
    price: 150,
    currency: 'money',
    kind: 'unlock',
    image: '/assets/added/desserts/Pancakes.png',
    soldIn: ['shop', 'menu'],
  },
  {
    id: 'money-250',
    name: 'Pocket money',
    description: 'Add 250 money to your wallet.',
    price: 100,
    currency: 'xp',
    kind: 'money',
    moneyAmount: 250,
    soldIn: ['shop'],
  },
  {
    id: 'money-600',
    name: 'Coin jar',
    description: 'Add 600 money to your wallet.',
    price: 200,
    currency: 'xp',
    kind: 'money',
    moneyAmount: 600,
    soldIn: ['shop'],
  },
  {
    id: 'money-1500',
    name: 'Savings tin',
    description: 'Add 1500 money to your wallet.',
    price: 450,
    currency: 'xp',
    kind: 'money',
    moneyAmount: 1500,
    soldIn: ['shop'],
  },
];

export const MENU_ITEMS = SHOP_ITEMS.filter((item) => item.soldIn.includes('menu'));
export const SHOP_PAGE_ITEMS = SHOP_ITEMS.filter((item) => item.soldIn.includes('shop'));
