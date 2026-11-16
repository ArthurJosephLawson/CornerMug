import type { PropPlacement, SnapSeat } from "@/types/room";

/** Proximity range (world px) within which a seat counts as "at the desk". */
export const STUDY_PROP_RANGE = 48;

function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * True when a laptop prop sits within STUDY_PROP_RANGE of a snap seat —
 * i.e. the player sitting there is studying on a laptop.
 */
export function seatHasLaptop(
  seat: SnapSeat,
  props: PropPlacement[],
  range: number = STUDY_PROP_RANGE,
): boolean {
  return props.some((p) => {
    if (!p.key.toLowerCase().includes("laptop")) {
      return false;
    }
    return distance(seat.x, seat.y, p.x, p.y) <= range;
  });
}
