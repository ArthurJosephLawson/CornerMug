/** XP needed to leave a rank and enter the next one. */
export const XP_PER_RANK = 500;

export interface Rank {
  /** 1-based position, matching the in-game name tag. */
  level: number;
  name: string;
  color: string;
  minXp: number;
}

interface RankSeed {
  name: string;
  color: string;
}

// Cloud -> Sky -> Space -> Moon -> Star -> Dream -> Nebula.
// Colors are picked to stay readable on the dark name-tag background.
const RANK_SEEDS: RankSeed[] = [
  { name: 'Cloud', color: '#CBD5E1' },
  { name: 'Sky', color: '#7DD3FC' },
  { name: 'Space', color: '#818CF8' },
  { name: 'Moon', color: '#E9E4F5' },
  { name: 'Star', color: '#FBBF24' },
  { name: 'Dream', color: '#F9A8D4' },
  { name: 'Nebula', color: '#C084FC' },
];

export const RANKS: Rank[] = RANK_SEEDS.map((seed, index) => ({
  level: index + 1,
  name: seed.name,
  color: seed.color,
  minXp: index * XP_PER_RANK,
}));

export const MAX_RANK = RANKS[RANKS.length - 1];

export function normalizeXp(xp: number | null | undefined): number {
  if (typeof xp !== 'number' || !Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
}

/** Rank for the given total XP. Ranks cap at Nebula. */
export function rankForXp(xp: number | null | undefined): Rank {
  const total = normalizeXp(xp);
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (total >= rank.minXp) current = rank;
  }
  return current;
}

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  xp: number;
  xpIntoRank: number;
  xpForNext: number;
  percent: number;
  isMax: boolean;
}

/** Progress towards the next rank, used by the dashboard bar. */
export function rankProgressForXp(xp: number | null | undefined): RankProgress {
  const total = normalizeXp(xp);
  const rank = rankForXp(total);
  const next = RANKS.find((candidate) => candidate.minXp > rank.minXp) ?? null;

  if (!next) {
    return {
      rank,
      next: null,
      xp: total,
      xpIntoRank: XP_PER_RANK,
      xpForNext: 0,
      percent: 100,
      isMax: true,
    };
  }

  const xpIntoRank = total - rank.minXp;
  return {
    rank,
    next,
    xp: total,
    xpIntoRank,
    xpForNext: next.minXp - total,
    percent: Math.min(100, Math.round((xpIntoRank / XP_PER_RANK) * 100)),
    isMax: false,
  };
}

/** Label used in name tags: `Name [Rank]`. */
export function rankTag(xp: number | null | undefined): string {
  return `[${rankForXp(xp).name}]`;
}
