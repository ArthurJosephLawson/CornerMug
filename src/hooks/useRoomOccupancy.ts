import { useEffect, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { roomChannelName } from '@/types/network.types';

/** How many shard tables the dashboard sums per public room. */
const SHARDS_SUMMED = 3;

/**
 * Live occupant totals for public rooms, summed across each room's shard
 * tables. Subscribes as an observer (no self-tracking); clients inside a
 * room track themselves via NetworkBridge, so the dashboard just counts.
 */
export function useRoomOccupancy(roomIds: string[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = roomIds.join(',');

  useEffect(() => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) {
      setCounts({});
      return;
    }

    const roomChannels = new Map<string, RealtimeChannel[]>();

    const refresh = (roomId: string) => {
      const channels = roomChannels.get(roomId) ?? [];
      const total = channels.reduce(
        (sum, channel) => sum + Object.keys(channel.presenceState()).length,
        0,
      );
      setCounts((current) => ({ ...current, [roomId]: total }));
    };

    for (const roomId of ids) {
      const channels: RealtimeChannel[] = [];
      for (let shard = 1; shard <= SHARDS_SUMMED; shard += 1) {
        const channel = supabase.channel(roomChannelName(roomId, shard), {
          config: { broadcast: { self: false } },
        });
        channel
          .on('presence', { event: 'sync' }, () => refresh(roomId))
          .subscribe();
        channels.push(channel);
      }
      roomChannels.set(roomId, channels);
    }

    return () => {
      for (const channels of roomChannels.values()) {
        for (const channel of channels) {
          void supabase.removeChannel(channel);
        }
      }
      roomChannels.clear();
    };
  }, [key]);

  return counts;
}
