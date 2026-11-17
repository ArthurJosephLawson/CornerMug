import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, SendHorizontal } from 'lucide-react';
import type { ChatMessage } from '@/types/engine.types';
import { Button } from '@/components/ui/Button';

export interface RoomChatDrawerProps {
  messages: ChatMessage[];
  connected: boolean;
  selfId: string;
  onSend: (text: string) => Promise<void>;
}

function messageTime(sentAt: number): string {
  return new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function RoomChatDrawer({ messages, connected, selfId, onSend }: RoomChatDrawerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await onSend(text);
      setDraft('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {open ? (
        <div className="flex h-80 w-72 flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white/90 shadow-card backdrop-blur">
          <div className="flex items-center justify-between border-b border-charcoal/5 px-3 py-2">
            <p className="text-sm font-bold">Room chat</p>
            <span className={`pill ${connected ? 'bg-sage/60' : 'bg-pink/60'} text-[10px]`}>
              {connected ? 'live' : 'offline'}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
            {messages.length === 0 ? (
              <p className="pt-6 text-center text-xs text-charcoal/45">
                Quiet in here. Say hello.
              </p>
            ) : (
              messages.map((message) => {
                const own = message.userId === selfId;
                return (
                  <div key={message.id} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                    <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">
                      {own ? 'You' : message.username} · {messageTime(message.sentAt)}
                    </span>
                    <span
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-xl px-2.5 py-1.5 text-xs ${
                        own ? 'bg-lavender/70 text-charcoal' : 'bg-charcoal/5 text-charcoal'
                      }`}
                    >
                      {message.text}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-charcoal/5 p-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Message..."
              maxLength={280}
              className="min-w-0 flex-1 rounded-full border border-charcoal/10 bg-white px-3 py-1.5 text-xs outline-none focus:border-lavender"
            />
            <Button type="submit" size="sm" loading={sending} aria-label="Send message">
              <SendHorizontal className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-charcoal text-ivory shadow-card transition-colors hover:bg-charcoal-soft"
        aria-label={open ? 'Hide chat' : 'Show chat'}
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    </div>
  );
}
