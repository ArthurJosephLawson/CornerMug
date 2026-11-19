import { Coins, Sparkles, Trophy } from 'lucide-react';
import { rankProgressForXp } from '@/lib/ranks';
import { Card } from '@/components/ui/Card';

export interface ProgressPanelProps {
  xp: number;
  money: number;
}

/**
 * Dashboard progression card: current rank, XP bar toward the next rank, and
 * the money wallet. Colors come from the rank table so the name tag and the
 * dashboard always agree.
 */
export function ProgressPanel({ xp, money }: ProgressPanelProps) {
  const progress = rankProgressForXp(xp);
  const { rank, next } = progress;

  return (
    <Card
      className="relative overflow-hidden border-white/60"
      style={{
        background: 'linear-gradient(135deg, #F6F1FF 0%, #FFF8EF 55%, #EFFAF3 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: rank.color }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-14 left-1/3 h-32 w-32 rounded-full bg-white/70 blur-2xl"
        aria-hidden
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/45">
              Your journey
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-charcoal shadow-soft"
                style={{ backgroundColor: `${rank.color}CC` }}
                aria-hidden
              >
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xl font-bold leading-tight">{rank.name}</h2>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">
                  Rank {rank.level} of 7
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="pill bg-white/80 text-charcoal shadow-soft">
              <Coins className="h-3.5 w-3.5 text-butter-deep" />
              <span className="font-semibold">{money.toLocaleString()}</span>
              <span className="text-charcoal/45">money</span>
            </span>
            <span className="pill bg-charcoal text-ivory">
              <Sparkles className="h-3.5 w-3.5 text-lavender" />
              {progress.xp.toLocaleString()} XP
            </span>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-end justify-between gap-3 text-[11px] font-semibold text-charcoal/55">
            <span>
              {progress.isMax ? 'Highest rank reached' : `${progress.xpIntoRank} / 500 XP this rank`}
            </span>
            <span className="text-charcoal/40">
              {progress.isMax ? 'Nebula' : `${progress.xpForNext} XP to ${next?.name}`}
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-charcoal/5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={500}
            aria-valuenow={progress.xpIntoRank}
            aria-label={`XP progress toward ${next?.name ?? 'top rank'}`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out"
              style={{
                width: `${progress.percent}%`,
                background: `linear-gradient(90deg, ${rank.color} 0%, ${rank.color} 40%, #FFFFFF 160%)`,
                boxShadow: `0 0 12px ${rank.color}99`,
              }}
            />
          </div>
          <p className="mt-2 text-[11px] text-charcoal/45">
            Earn 12 XP for every minute you spend in a room. Every 500 XP moves you up a rank.
          </p>
        </div>
      </div>
    </Card>
  );
}
