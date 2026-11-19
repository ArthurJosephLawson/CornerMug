import type { CharacterSlug, Direction } from '@/types/engine.types';

export const SPRITES_ROOT = '/sprites';

export const MANIFEST_URL = `${SPRITES_ROOT}/manifest.json`;

export const CHARACTER_CELL_WIDTH = 64;
export const CHARACTER_CELL_HEIGHT = 64;
export const CHARACTER_PIVOT_X = 32;
export const CHARACTER_PIVOT_Y = 54;

export const TILE_CELL_WIDTH = 32;
export const TILE_CELL_HEIGHT = 32;

export const PROP_CELL_WIDTH = 64;
export const PROP_CELL_HEIGHT = 64;
export const PROP_PIVOT_X = 32;
export const PROP_PIVOT_Y = 58;

export const IDLE_FRAME_COUNT = 9;
export const IDLE_FRAME_MS = 300;
export const WALK_FRAME_COUNT = 8;
export const WALK_FRAME_MS = 100;

export const ANIMATION_DIRECTIONS: Direction[] = ['south', 'east', 'north', 'west'];

/** Kitten follower sheet: row 0 idle, row 1 walk right, row 2 walk left. */
export const PET_SHEET_URL = `${SPRITES_ROOT}/pets/kitten.png`;
export const PET_CELL_SIZE = 32;
export const PET_DRAW_SIZE = 30;

export interface CharacterConfig {
  slug: CharacterSlug;
  name: string;
  sheet: string;
  metadata: string;
}

export const CHARACTERS: CharacterConfig[] = [
  {
    slug: 'resident',
    name: 'Resident',
    sheet: `${SPRITES_ROOT}/art/characters/resident/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/resident/aligned.json`,
  },
  {
    slug: 'barista',
    name: 'Barista',
    sheet: `${SPRITES_ROOT}/art/characters/barista/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/barista/aligned.json`,
  },
  {
    slug: 'cook',
    name: 'Cook',
    sheet: `${SPRITES_ROOT}/art/characters/cook/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/cook/aligned.json`,
  },
  {
    slug: 'courier',
    name: 'Courier',
    sheet: `${SPRITES_ROOT}/art/characters/courier/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/courier/aligned.json`,
  },
  {
    slug: 'maintenance-worker',
    name: 'Maintenance Worker',
    sheet: `${SPRITES_ROOT}/art/characters/maintenance-worker/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/maintenance-worker/aligned.json`,
  },
  {
    slug: 'office-worker',
    name: 'Office Worker',
    sheet: `${SPRITES_ROOT}/art/characters/office-worker/aligned.png`,
    metadata: `${SPRITES_ROOT}/art/characters/office-worker/aligned.json`,
  },
];

export const CHARACTER_BY_SLUG = new Map<CharacterSlug, CharacterConfig>(
  CHARACTERS.map((character) => [character.slug, character]),
);

export function clipKey(action: 'idle' | 'walk', direction: Direction): string {
  return `${action}_${direction}`;
}

export function characterConfig(slug: CharacterSlug): CharacterConfig {
  const config = CHARACTER_BY_SLUG.get(slug);
  if (!config) {
    throw new Error(`Unknown character slug: ${slug}`);
  }
  return config;
}
