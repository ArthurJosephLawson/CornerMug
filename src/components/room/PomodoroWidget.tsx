import { useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { formatClock } from '@/lib/formatTime';
import type { PomodoroTimerState } from '@/hooks/usePomodoroTimer';
import { Button } from '@/components/ui/Button';

export interface PomodoroWidgetProps {
  timer: PomodoroTimerState;
}

export function PomodoroWidget({ timer }: PomodoroWidgetProps) {
  const [open, setOpen] = useState(true);
  const totalSeconds = timer.mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = totalSeconds > 0 ? 1 - timer.secondsLeft / totalSeconds : 0;

  return (
    <div className="pointer-events-auto w-64 rounded-2xl border border-charcoal/10 bg-white/85 p-4 shadow-card backdrop-blur">
      <div className="flex items-center justify-between">
        <span
          className={`pill ${
            timer.mode === 'focus' ? 'bg-lavender/70 text-charcoal' : 'bg-sage/70 text-charcoal'
          }`}
        >
          {timer.mode === 'focus' ? 'Focus' : 'Break'}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-full p-1 text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal"
          aria-label={open ? 'Collapse timer' : 'Expand timer'}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {open ? (
        <>
          <p className="mt-3 text-center font-mono text-4xl font-bold tabular-nums tracking-tight">
            {formatClock(timer.secondsLeft)}
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-charcoal/10">
            <div
              className={`h-full rounded-full transition-all ${timer.mode === 'focus' ? 'bg-lavender-deep' : 'bg-sage-deep'}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-charcoal/50">
            {timer.completedFocusSessions} focus session{timer.completedFocusSessions === 1 ? '' : 's'} done
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Button variant="primary" size="sm" onClick={timer.running ? timer.pause : timer.start}>
              {timer.running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {timer.running ? 'Pause' : 'Start'}
            </Button>
            <Button variant="outline" size="sm" onClick={timer.reset} aria-label="Reset timer">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={timer.skip} aria-label="Skip to next phase">
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
