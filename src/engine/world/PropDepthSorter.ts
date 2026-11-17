/**
 * Depth-sorting helpers. Props and avatars share one ground-Y ordering so a
 * player walking behind a sofa is occluded correctly.
 */
export interface DepthSortable {
  groundY: number;
}

export class PropDepthSorter {
  sort<T extends DepthSortable>(items: T[]): T[] {
    return [...items].sort((a, b) => {
      if (a.groundY !== b.groundY) return a.groundY - b.groundY;
      return 0;
    });
  }

  static sort<T extends DepthSortable>(items: T[]): T[] {
    return new PropDepthSorter().sort(items);
  }
}
