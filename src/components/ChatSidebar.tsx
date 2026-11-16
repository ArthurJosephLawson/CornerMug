"use client";

/**
 * Bare-bones chat sidebar shell. Real table-scoped chat arrives with the
 * Supabase Realtime wiring (Phase 3). Styled as a warm card.
 * `tableId` is the local scope: the seat's table while seated, "cafe" while walking.
 */
export default function ChatSidebar({ tableId }: { tableId: string }) {
  return (
    <aside className="card">
      <h2>Table chat</h2>
      <p className="muted">table: {tableId}</p>
      <p className="muted">chat arrives with Supabase</p>
    </aside>
  );
}
