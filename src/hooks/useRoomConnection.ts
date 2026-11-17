import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NetworkBridge } from '@/engine/multiplayer/NetworkBridge';
import { PresenceTracker } from '@/engine/multiplayer/PresenceTracker';
import { generateLocalId } from '@/lib/keyGenerator';
import { supabase } from '@/lib/supabaseClient';
import type { CharacterSlug, ChatMessage, PresencePayload } from '@/types/engine.types';
import {
  MAX_ROOM_SHARDS,
  ROOM_CAPACITY,
  baseRoomId,
  roomChannelName,
  type NetworkPeer,
} from '@/types/network.types';

export interface RoomConnectionOptions {
  /** Probe tables until one has space (public rooms). Off = single channel. */
  shard?: boolean;
  /** Players per table before overflow to the next shard. Default ROOM_CAPACITY. */
  capacity?: number;
}

export interface RoomConnectionState {
  connected: boolean;
  peers: NetworkPeer[];
  messages: ChatMessage[];
  roomFull: boolean;
  shardNumber: number;
  sendChat: (text: string) => Promise<void>;
  broadcastPresence: (payload: PresencePayload) => void;
  sendJoin: () => Promise<void>;
  sendLeave: () => Promise<void>;
}

const PROBE_TIMEOUT_MS = 2_500;
const PRUNE_INTERVAL_MS = 5_000;

/**
 * Subscribe to one shard's channel and resolve with its occupant count taken
 * from the first presence sync (other players only — we have not tracked
 * ourselves yet). If nothing arrives in time, the shard is treated as free so
 * a network hiccup never locks players out.
 */
function probeShard(
  roomId: string,
  shard: number,
  userId: string,
): Promise<{ channel: RealtimeChannel; occupants: number }> {
  return new Promise((resolve) => {
    const channel = supabase.channel(roomChannelName(roomId, shard), {
      config: {
        broadcast: { self: false },
        presence: { key: userId },
      },
    });

    let settled = false;
    const finish = (occupants: number) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve({ channel, occupants });
    };

    const timer = window.setTimeout(() => finish(0), PROBE_TIMEOUT_MS);

    channel
      .on('presence', { event: 'sync' }, () => {
        finish(Object.keys(channel.presenceState()).length);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          finish(0);
        }
      });
  });
}

/**
 * React binding around one room's Supabase Realtime channel. Peer state lives
 * in refs and is mirrored into state only when the roster changes. With
 * `shard` enabled, tables are probed in order and the first one with space
 * becomes this client's room instance; when every table is full `roomFull` is
 * set and the UI should show the "room is full" panel.
 */
export function useRoomConnection(
  roomId: string,
  userId: string,
  username: string,
  slug: CharacterSlug,
  options: RoomConnectionOptions = {},
): RoomConnectionState {
  const capacity = options.capacity ?? ROOM_CAPACITY;
  const sharded = options.shard ?? false;
  const baseId = baseRoomId(roomId);

  const bridgeRef = useRef<NetworkBridge | null>(null);
  const trackerRef = useRef<PresenceTracker>(new PresenceTracker(userId));

  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<NetworkPeer[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomFull, setRoomFull] = useState(false);
  const [shardNumber, setShardNumber] = useState(1);

  useEffect(() => {
    if (!roomId || !userId) return;
    const tracker = trackerRef.current;
    let cancelled = false;
    let pruneId = 0;
    let activeChannel: RealtimeChannel | null = null;

    const attach = (channel: RealtimeChannel, table: number) => {
      const bridge = new NetworkBridge(channel);
      bridgeRef.current = bridge;
      activeChannel = channel;

      bridge.connect(
        userId,
        {
          onStatus: (status) => setConnected(status === 'SUBSCRIBED'),
          onPresence: (payload) => {
            tracker.handlePresence(payload);
            setPeers(tracker.list());
          },
          onJoin: (signal) => {
            tracker.handleJoin(signal);
            setPeers(tracker.list());
          },
          onLeave: (signal) => {
            tracker.handleLeave(signal);
            setPeers(tracker.list());
          },
          onChat: (message) => {
            setMessages((current) => [...current.slice(-49), message]);
          },
        },
        { id: userId, username, slug },
      );

      setShardNumber(table);
      pruneId = window.setInterval(() => {
        tracker.prune();
        setPeers(tracker.list());
      }, PRUNE_INTERVAL_MS);
    };

    void (async () => {
      const maxShards = sharded ? MAX_ROOM_SHARDS : 1;
      for (let table = 1; table <= maxShards; table += 1) {
        const { channel, occupants } = await probeShard(baseId, table, userId);
        if (cancelled) {
          void supabase.removeChannel(channel);
          return;
        }
        if (occupants < capacity) {
          attach(channel, table);
          return;
        }
        void supabase.removeChannel(channel);
      }
      if (!cancelled) setRoomFull(true);
    })();

    return () => {
      cancelled = true;
      window.clearInterval(pruneId);
      if (activeChannel) void supabase.removeChannel(activeChannel);
      bridgeRef.current = null;
      tracker.clear();
      setPeers([]);
      setMessages([]);
      setConnected(false);
      setRoomFull(false);
      setShardNumber(1);
    };
  }, [roomId, baseId, userId, username, slug, sharded, capacity]);

  const sendChat = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const message: ChatMessage = {
        id: generateLocalId(),
        userId,
        username,
        text: trimmed.slice(0, 280),
        sentAt: Date.now(),
      };
      setMessages((current) => [...current.slice(-49), message]);
      await bridgeRef.current?.broadcast('chat', message);
    },
    [userId, username],
  );

  const broadcastPresence = useCallback((payload: PresencePayload) => {
    void bridgeRef.current?.broadcast('presence', payload);
  }, []);

  const sendJoin = useCallback(async () => {
    await bridgeRef.current?.broadcast('join', { id: userId, username, slug });
  }, [userId, username, slug]);

  const sendLeave = useCallback(async () => {
    await bridgeRef.current?.broadcast('leave', { id: userId });
  }, [userId]);

  return {
    connected,
    peers,
    messages,
    roomFull,
    shardNumber,
    sendChat,
    broadcastPresence,
    sendJoin,
    sendLeave,
  };
}
