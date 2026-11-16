"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/lib/supabase/client";

/**
 * Typed Supabase Realtime stubs. When the public env vars are missing these
 * hooks return null / no-ops (no crash) — real wiring is Phase 3.
 *
 *   useRoomPresence   — who is in the room
 *   broadcastMove     — send my position/facing
 *   useTableChat      — table-scoped chat messages
 *   useSharedPomodoro — synced 25/5 timer state
 */

export type PresencePlayer = {
  id: string;
  name: string;
  x: number;
  y: number;
  facing: "left" | "right";
  seatedSeatId: string | null;
};

export type TableChatMessage = {
  id: string;
  playerName: string;
  text: string;
  sentAt: string;
};

export type SharedPomodoroState = {
  mode: "focus" | "break";
  endsAtMs: number;
  running: boolean;
} | null;

function envReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Who is in the room right now. Returns null while Supabase is unconfigured. */
export function useRoomPresence(roomId: string): PresencePlayer[] | null {
  const [players, setPlayers] = useState<PresencePlayer[] | null>(null);

  useEffect(() => {
    if (!envReady()) {
      setPlayers(null);
      return;
    }
    // Phase 3: channel(roomId).on("presence") tracking.
    setPlayers([]);
  }, [roomId]);

  return players;
}

/** Broadcast my movement. No-op while Supabase is unconfigured. */
export function broadcastMove(
  roomId: string,
  state: Pick<PresencePlayer, "id" | "x" | "y" | "facing" | "seatedSeatId">,
): void {
  if (!envReady()) {
    return;
  }
  // Phase 3: channel(roomId).send({ type: "broadcast", event: "move", payload: state })
  void roomId;
  void state;
}

/** Table-scoped chat. Returns null while Supabase is unconfigured. */
export function useTableChat(
  roomId: string,
  tableId: string,
): { messages: TableChatMessage[]; send: (text: string) => void } | null {
  const [messages, setMessages] = useState<TableChatMessage[] | null>(null);

  useEffect(() => {
    if (!envReady()) {
      setMessages(null);
      return;
    }
    // Phase 3: channel(`${roomId}:${tableId}`).on("broadcast", "chat", ...)
    setMessages([]);
  }, [roomId, tableId]);

  return messages === null
    ? null
    : {
        messages,
        send: (text: string) => {
          void text;
        },
      };
}

/** Synced shared Pomodoro. Returns null while Supabase is unconfigured. */
export function useSharedPomodoro(roomId: string): SharedPomodoroState {
  const [state, setState] = useState<SharedPomodoroState>(null);

  useEffect(() => {
    if (!envReady()) {
      setState(null);
      return;
    }
    // Phase 3: shared channel state.
    setState(null);
  }, [roomId]);

  return state;
}

/** Internal: create a client once, for Phase 3 wiring. */
export function getClient(): SupabaseClient | null {
  if (!envReady()) {
    return null;
  }
  return createSupabaseClient();
}

export type { RealtimeChannel };
