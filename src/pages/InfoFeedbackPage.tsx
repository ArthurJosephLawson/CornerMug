import { useEffect, useState, type FormEvent } from 'react';
import {
  Bug,
  Check,
  Coffee,
  Lightbulb,
  Mail,
  MessageSquare,
  Send,
  Star,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { listMyFeedback, submitFeedback } from '@/services/feedbackService';
import type { FeedbackCategory, FeedbackRow } from '@/types/database.types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const categories: Array<{ value: FeedbackCategory; label: string; icon: typeof Bug }> = [
  { value: 'bug', label: 'Bug report', icon: Bug },
  { value: 'feature', label: 'Feature idea', icon: Lightbulb },
  { value: 'review', label: 'Review', icon: Star },
  { value: 'general', label: 'General', icon: MessageSquare },
];

const categoryLabel: Record<FeedbackCategory, string> = {
  bug: 'Bug report',
  feature: 'Feature idea',
  review: 'Review',
  general: 'General',
};

const linedPaper = {
  backgroundImage:
    'repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, rgba(30, 30, 36, 0.08) 28px)',
};

function formatLetterDate(value: string): string {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InfoFeedbackPage() {
  const { profile } = useAuth();
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [letters, setLetters] = useState<FeedbackRow[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(true);

  const profileId = profile?.id ?? '';

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    setLoadingLetters(true);
    void listMyFeedback(profileId)
      .then((rows) => {
        if (!cancelled) setLetters(rows);
      })
      .finally(() => {
        if (!cancelled) setLoadingLetters(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!profile || busy) return;
    setBusy(true);
    try {
      const sent = await submitFeedback(
        profile.id,
        category,
        subject.trim() || categoryLabel[category],
        message,
      );
      setLetters((current) => [sent, ...current].slice(0, 20));
      setSubject('');
      setMessage('');
      showToast('Your letter is on its way. Thank you!', 'success');
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not send the letter.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
            CornerMug post office
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Mail className="h-6 w-6 text-lavender-deep" /> Write us a letter
          </h1>
          <p className="mt-1 max-w-xl text-sm text-charcoal/55">
            Bugs, ideas, kind words — everything lands in the same mailbox. We read every envelope.
          </p>
        </div>
        <span className="pill bg-butter/50 text-charcoal">
          <Coffee className="h-3.5 w-3.5" /> replies usually within a few days
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-2xl border border-charcoal/10 shadow-card"
          style={{ backgroundColor: '#FFFCF3' }}
        >
          {/* Envelope top strip */}
          <div
            className="relative h-20 overflow-hidden border-b border-dashed border-charcoal/15"
            style={{ background: 'linear-gradient(160deg, #F6F1FF 0%, #FFF6E5 100%)' }}
          >
            <div className="absolute inset-0" aria-hidden>
              <div className="absolute -left-6 top-4 h-24 w-24 rotate-45 border border-charcoal/10 bg-white/40" />
              <div className="absolute -right-8 -top-6 h-28 w-28 rounded-full border border-charcoal/10 bg-white/30" />
            </div>
            <div className="relative flex h-full items-center justify-between gap-3 px-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/55">
                <Mail className="h-4 w-4" /> CornerMug Mail
              </div>
              <span className="rounded-md border border-charcoal/20 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-charcoal/50">
                first class
              </span>
            </div>
            <div className="absolute -bottom-3 right-8 flex h-12 w-12 rotate-6 items-center justify-center rounded-full border border-pink-deep/40 bg-pink/40 text-[9px] font-bold uppercase tracking-wide text-charcoal/60 shadow-soft">
              seal
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border-b border-charcoal/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">
                  To
                </p>
                <p className="text-sm font-semibold">The CornerMug team</p>
              </div>
              <div className="rounded-xl border-b border-charcoal/10 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/40">
                  From
                </p>
                <p className="truncate text-sm font-semibold">
                  {profile?.username ?? 'A quiet visitor'}
                  {profile ? <span className="font-normal text-charcoal/45"> · {profile.email}</span> : null}
                </p>
              </div>
            </div>

            <Input
              label="Subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={120}
              placeholder="A short line about your letter"
            />

            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Stamp
              </legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategory(option.value)}
                    aria-pressed={category === option.value}
                    className={`flex items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                      category === option.value
                        ? 'border-lavender-deep bg-lavender/30 text-charcoal'
                        : 'border-charcoal/20 text-charcoal/55 hover:border-charcoal/40'
                    }`}
                  >
                    <option.icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="letter-body"
                className="text-xs font-semibold uppercase tracking-wide text-charcoal/60"
              >
                Letter
              </label>
              <textarea
                id="letter-body"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Dear CornerMug..."
                rows={8}
                maxLength={2000}
                required
                className="mt-2 w-full resize-none rounded-xl border border-charcoal/10 bg-white/50 px-3 py-2 text-sm leading-7 text-charcoal outline-none transition-colors placeholder:text-charcoal/30 focus:border-lavender focus:ring-2 focus:ring-lavender/40"
                style={linedPaper}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-charcoal/15 pt-4">
              <p className="text-xs text-charcoal/45">
                {message.length}/2000 · signed by {profile?.username ?? 'you'}
              </p>
              <Button type="submit" loading={busy}>
                <Send className="h-4 w-4" /> Seal &amp; send
              </Button>
            </div>
          </div>
        </form>

        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Your sent mail</h2>
            <span className="text-[11px] font-semibold text-charcoal/40">
              {letters.length} letter{letters.length === 1 ? '' : 's'}
            </span>
          </div>

          {loadingLetters ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white/60 px-4 py-8 text-center text-xs text-charcoal/45">
              Opening the mailbox...
            </div>
          ) : letters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white/50 px-4 py-8 text-center">
              <Mail className="mx-auto h-6 w-6 text-charcoal/25" />
              <p className="mt-2 text-sm font-semibold">No letters yet</p>
              <p className="mt-1 text-xs text-charcoal/45">
                Your first envelope will appear here after you send it.
              </p>
            </div>
          ) : (
            <ul className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
              {letters.map((letter) => (
                <li
                  key={letter.id}
                  className="rounded-2xl border border-charcoal/10 bg-white/75 p-3 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">
                        <Check className="h-3 w-3 text-sage-deep" /> sent
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold">
                        {letter.subject ?? categoryLabel[letter.category]}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md border border-charcoal/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-charcoal/45">
                      {categoryLabel[letter.category]}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-charcoal/55">
                    {letter.message}
                  </p>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-charcoal/35">
                    {formatLetterDate(letter.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <p className="rounded-xl bg-sage/20 px-3 py-2 text-[11px] leading-relaxed text-charcoal/55">
            Letters are private: only you and the CornerMug team can read them.
          </p>
        </aside>
      </div>
    </div>
  );
}
