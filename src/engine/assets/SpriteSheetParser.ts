import {
  CHARACTER_CELL_HEIGHT,
  CHARACTER_CELL_WIDTH,
  CHARACTER_PIVOT_X,
  CHARACTER_PIVOT_Y,
  IDLE_FRAME_COUNT,
  IDLE_FRAME_MS,
  WALK_FRAME_COUNT,
  WALK_FRAME_MS,
} from '@/config/sprites.config';
import type {
  AnimationClip,
  AnimationFrame,
  CharacterSlug,
  Direction,
  FrameRect,
  ParsedSpriteSheet,
} from '@/types/engine.types';

interface RawFrame {
  rect?: unknown;
  duration_ms?: unknown;
}

interface RawClip {
  action?: unknown;
  direction?: unknown;
  loop?: unknown;
  frames?: RawFrame[];
}

interface RawAlignedMetadata {
  cell?: unknown;
  pivot?: unknown;
  clips?: Record<string, RawClip>;
}

function isRect(value: unknown): value is [number, number, number, number] {
  if (!Array.isArray(value) || value.length !== 4) return false;
  return value.every((part) => typeof part === 'number' && Number.isFinite(part));
}

function parseFrame(raw: RawFrame, fallbackMs: number): AnimationFrame | null {
  if (!isRect(raw.rect)) return null;
  const duration = typeof raw.duration_ms === 'number' ? raw.duration_ms : null;
  return {
    x: raw.rect[0],
    y: raw.rect[1],
    w: raw.rect[2],
    h: raw.rect[3],
    durationMs: duration && duration > 0 ? duration : fallbackMs,
  };
}

function parseClip(name: string, raw: RawClip): AnimationClip | null {
  const action = raw.action === 'walk' ? 'walk' : 'idle';
  const direction = (['south', 'east', 'north', 'west'] as Direction[]).find(
    (candidate) => candidate === raw.direction,
  );
  if (!direction) return null;

  const fallbackMs = action === 'walk' ? WALK_FRAME_MS : IDLE_FRAME_MS;
  const frames = (raw.frames ?? [])
    .map((frame) => parseFrame(frame, fallbackMs))
    .filter((frame): frame is AnimationFrame => frame !== null);
  if (frames.length === 0) return null;

  return {
    name,
    action,
    direction,
    loop: raw.loop !== false,
    frames,
  };
}

export function parseAlignedMetadata(
  metadata: RawAlignedMetadata | string,
  slug: CharacterSlug,
  image: HTMLImageElement,
): ParsedSpriteSheet {
  const raw: RawAlignedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

  const cell = Array.isArray(raw.cell) ? raw.cell : ([CHARACTER_CELL_WIDTH, CHARACTER_CELL_HEIGHT] as const);
  const pivot = Array.isArray(raw.pivot) ? raw.pivot : ([CHARACTER_PIVOT_X, CHARACTER_PIVOT_Y] as const);

  const clips: Record<string, AnimationClip> = {};
  for (const [name, clipRaw] of Object.entries(raw.clips ?? {})) {
    const clip = parseClip(name, clipRaw);
    if (clip) clips[name] = clip;
  }

  for (const [action, expected] of [
    ['idle', IDLE_FRAME_COUNT],
    ['walk', WALK_FRAME_COUNT],
  ] as const) {
    const expectedMs = action === 'idle' ? IDLE_FRAME_MS : WALK_FRAME_MS;
    const count = Object.values(clips).filter((clip) => clip.action === action).length;
    if (count > 0) {
      const frameCounts = Object.values(clips)
        .filter((clip) => clip.action === action)
        .map((clip) => clip.frames.length);
      const minFrames = Math.min(...frameCounts);
      if (minFrames < expected) {
        console.warn(`[sprites] ${slug} ${action} has ${minFrames} frames, expected ${expected}`);
      }
    }
    void expectedMs;
  }

  return {
    slug,
    image,
    cellWidth: cell[0] ?? CHARACTER_CELL_WIDTH,
    cellHeight: cell[1] ?? CHARACTER_CELL_HEIGHT,
    pivotX: pivot[0] ?? CHARACTER_PIVOT_X,
    pivotY: pivot[1] ?? CHARACTER_PIVOT_Y,
    clips,
  };
}

export function clipSummary(sheet: ParsedSpriteSheet): { idle: number; walk: number } {
  const values = Object.values(sheet.clips);
  return {
    idle: values.filter((clip) => clip.action === 'idle').length,
    walk: values.filter((clip) => clip.action === 'walk').length,
  };
}
