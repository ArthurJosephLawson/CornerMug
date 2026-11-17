import { PRESENCE_STALE_MS } from '@/types/network.types';
import type {
  Direction,
  JoinSignal,
  LeaveSignal,
  PresencePayload,
} from '@/types/engine.types';
import type { NetworkPeer } from '@/types/network.types';

/**
 * Keeps the live set of remote players seen over the room channel. Stale
 * peers are pruned by the game loop.
 */
export class PresenceTracker {
  private readonly peers = new Map<string, NetworkPeer>();

  constructor(
    private readonly selfId: string,
    private readonly staleMs: number = PRESENCE_STALE_MS,
  ) {}

  handlePresence(payload: PresencePayload): void {
    if (payload.id === this.selfId) return;
    this.peers.set(payload.id, { ...payload, lastSeen: Date.now() });
  }

  handleJoin(signal: JoinSignal): void {
    if (signal.id === this.selfId) return;
    const existing = this.peers.get(signal.id);
    this.peers.set(signal.id, {
      id: signal.id,
      username: signal.username,
      slug: signal.slug,
      x: existing?.x ?? 0,
      y: existing?.y ?? 0,
      direction: 'south' as Direction,
      moving: false,
      seated: false,
      lastSeen: Date.now(),
    });
  }

  handleLeave(signal: LeaveSignal): void {
    this.peers.delete(signal.id);
  }

  prune(now = Date.now()): void {
    for (const [id, peer] of this.peers) {
      if (now - peer.lastSeen > this.staleMs) this.peers.delete(id);
    }
  }

  list(): NetworkPeer[] {
    return [...this.peers.values()];
  }

  get(id: string): NetworkPeer | undefined {
    return this.peers.get(id);
  }

  size(): number {
    return this.peers.size;
  }

  clear(): void {
    this.peers.clear();
  }
}
