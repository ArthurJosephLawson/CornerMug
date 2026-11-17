import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import type { ChatMessage, JoinSignal, LeaveSignal, PresencePayload } from '@/types/engine.types';

export interface BridgePresenceMeta {
  id: string;
  username: string;
  slug: string;
}

export interface BridgeHandlers {
  onPresence?: (payload: PresencePayload) => void;
  onChat?: (message: ChatMessage) => void;
  onJoin?: (signal: JoinSignal) => void;
  onLeave?: (signal: LeaveSignal) => void;
  onStatus?: (status: string) => void;
}

export type BroadcastEvent = 'presence' | 'chat' | 'join' | 'leave';

/**
 * Thin wrapper around one Supabase Realtime channel. The channel instance is
 * injected so a channel probed for capacity (subscribed before we knew it had
 * space) can be reused instead of reconnecting. Broadcast is used for all
 * payloads so no extra server is required. Realtime presence tracking is used
 * for the live roster so occupancy counts work even for clients that only
 * observe the room (e.g. the dashboard).
 */
export class NetworkBridge {
  constructor(private readonly channel: RealtimeChannel) {}

  connect(senderId: string, handlers: BridgeHandlers, meta?: BridgePresenceMeta): void {
    this.channel
      .on('broadcast', { event: 'presence' }, ({ payload }) => {
        handlers.onPresence?.(payload as PresencePayload);
      })
      .on('broadcast', { event: 'chat' }, ({ payload }) => {
        handlers.onChat?.(payload as ChatMessage);
      })
      .on('broadcast', { event: 'join' }, ({ payload }) => {
        handlers.onJoin?.(payload as JoinSignal);
      })
      .on('broadcast', { event: 'leave' }, ({ payload }) => {
        handlers.onLeave?.(payload as LeaveSignal);
      });

    if (this.channel.state === 'joined') {
      // Already subscribed during capacity probing: just join presence.
      if (meta) void this.channel.track(meta);
      handlers.onStatus?.('SUBSCRIBED');
      return;
    }

    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' && meta) {
        void this.channel?.track(meta);
      }
      handlers.onStatus?.(status);
    });
  }

  async broadcast(event: BroadcastEvent, payload: unknown): Promise<void> {
    if (this.channel.state !== 'joined') return;
    await this.channel.send({ type: 'broadcast', event, payload });
  }

  disconnect(): void {
    void supabase.removeChannel(this.channel);
  }
}
