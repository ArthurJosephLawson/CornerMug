import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { formatClock } from '@/lib/formatTime';
import type { PomodoroTimerState } from '@/hooks/usePomodoroTimer';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';

export interface PomodoroWidgetProps {
  timer: PomodoroTimerState;
}

export function PomodoroWidget({ timer }: PomodoroWidgetProps) {
  const [open, setOpen] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const totalSeconds = timer.mode === 'focus' ? 25 * 60 : 5 * 60;
  const progress = totalSeconds > 0 ? 1 - timer.secondsLeft / totalSeconds : 0;

  const modePill = (
    <span
      className={`pill ${
        timer.mode === 'focus' ? 'bg-lavender/70 text-charcoal' : 'bg-sage/70 text-charcoal'
      }`}
    >
      {timer.mode === 'focus' ? 'Focus' : 'Break'}
    </span>
  );

  const clock = (
    <p className="text-center font-mono text-4xl font-bold tabular-nums tracking-tight">
      {formatClock(timer.secondsLeft)}
    </p>
  );

  const progressBar = (
    <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/10">
      <div
        className={`h-full rounded-full transition-all ${
          timer.mode === 'focus' ? 'bg-lavender-deep' : 'bg-sage-deep'
        }`}
        style={{ width: `${Math.round(progress * 100)}%` }}
      />
    </div>
  );

  const sessionNote = (
    <p className="text-center text-xs text-charcoal/50">
      {timer.completedFocusSessions} focus session{timer.completedFocusSessions === 1 ? '' : 's'} done
    </p>
  );

  const controls = (
    <div className="flex items-center justify-center gap-2">
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
  );

  return (
    <>
      {/* Desktop card */}
      <div className="pointer-events-auto hidden w-64 rounded-2xl border border-charcoal/10 bg-white/85 p-4 shadow-card backdrop-blur sm:block">
        <div className="flex items-center justify-between">
          {modePill}
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
            <div className="mt-3">{clock}</div>
            <div className="mt-3">{progressBar}</div>
            <div className="mt-2">{sessionNote}</div>
            <div className="mt-3">{controls}</div>
          </>
        ) : null}
      </div>

      {/* Phone pill + bottom sheet */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-charcoal shadow-card backdrop-blur transition-transform active:scale-95"
          aria-label={`Open focus timer, ${formatClock(timer.secondsLeft)} remaining`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              timer.running ? 'animate-pulse bg-sage-deep' : 'bg-charcoal/25'
            }`}
            aria-hidden
          />
          <span className="font-mono text-sm font-bold tabular-nums">
            {formatClock(timer.secondsLeft)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-charcoal/50">
            {timer.mode}
          </span>
        </button>

        <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Focus timer">
          <div className="flex items-center justify-between">
            {modePill}
            <span className="text-xs text-charcoal/45">25 min focus · 5 min break</span>
          </div>
          <div className="mt-4">{clock}</div>
          <div className="mt-4">{progressBar}</div>
          <div className="mt-3">{sessionNote}</div>
          <div className="mt-4">{controls}</div>
          <div className="mt-5 flex items-center gap-2 rounded-xl bg-sage/25 px-3 py-2 text-xs text-charcoal/60">
            <Check className="h-4 w-4 shrink-0 text-sage-deep" />
            Completed focus sessions are saved to your study stats.
          </div>
        </BottomSheet>
      </div>
    </>
  );
}
