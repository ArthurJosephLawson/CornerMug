"use client";

/**
 * Bare-bones chat sidebar shell. Real table-scoped chat arrives with the
 * Supabase Realtime wiring (Phase 3). Styled as a warm card.
 */
export default function ChatSidebar() {
  return (
    <aside className="card">
      <h2>Table chat</h2>
      <p className="muted">chat arrives with Supabase</p>
    </aside>
  );
}
