import { useState, type FormEvent } from 'react';
import { Bug, Coffee, Heart, Lightbulb, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { submitFeedback } from '@/services/feedbackService';
import type { FeedbackCategory } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const categories: Array<{ value: FeedbackCategory; label: string; icon: typeof Bug }> = [
  { value: 'bug', label: 'Bug report', icon: Bug },
  { value: 'feature', label: 'Feature idea', icon: Lightbulb },
  { value: 'review', label: 'Review', icon: Star },
  { value: 'general', label: 'General', icon: MessageSquare },
];

export function InfoFeedbackPage() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    try {
      await submitFeedback(profile.id, category, message);
      showToast('Thanks — your note reached the developer.', 'success');
      setMessage('');
      setCategory('general');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send feedback.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Info &amp; feedback</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Why CornerMug exists, and where to send ideas.
        </p>
      </div>

      <Card tone="peach">
        <div className="flex items-start gap-3">
          <Coffee className="mt-1 h-5 w-5 shrink-0 text-charcoal/50" />
          <div className="space-y-2 text-sm leading-relaxed text-charcoal/70">
            <p>
              CornerMug is a low-pressure place to study and hang out. No feeds, no streaks,
              no pressure to perform. You can sit quietly with a pomodoro timer, or open the
              chat and talk about whatever is on your mind.
            </p>
            <p>
              The goal is simple: make it easier to start focusing and to feel a little less
              alone while doing it.
            </p>
          </div>
        </div>
      </Card>

      <Card tone="lavender">
        <div className="mb-4 flex items-center gap-2">
          <Heart className="h-4 w-4 text-charcoal/50" />
          <h2 className="font-bold">Send a note to the developer</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {categories.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCategory(option.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                  category === option.value
                    ? 'border-lavender-deep bg-lavender/30 text-charcoal'
                    : 'border-charcoal/10 text-charcoal/55 hover:border-charcoal/25'
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What broke? What would make CornerMug feel better?"
            rows={5}
            maxLength={2000}
            required
            className="w-full resize-none rounded-xl border border-charcoal/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-lavender focus:ring-2 focus:ring-lavender/40"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-charcoal/45">{message.length}/2000</p>
            <Button type="submit" loading={busy}>
              Send feedback
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}