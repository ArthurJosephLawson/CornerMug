import { Armchair, Clock3, Flame } from 'lucide-react';
import type { StatsSnapshot } from '@/services/statsService';
import { formatSecondsAsDuration } from '@/lib/formatTime';
import { Card } from '@/components/ui/Card';

export interface StudyStatsGridProps {
  stats: StatsSnapshot;
}

export function StudyStatsGrid({ stats }: StudyStatsGridProps) {
  const items = [
    {
      label: 'Focus time',
      value: `${Math.floor(stats.focusMinutes / 60)}h ${stats.focusMinutes % 60}m`,
      hint: `${stats.sessionsCompleted} sessions`,
      icon: Clock3,
      tone: 'lavender' as const,
    },
    {
      label: 'Hangout time',
      value: formatSecondsAsDuration(stats.hangoutSeconds),
      hint: 'time spent in rooms',
      icon: Armchair,
      tone: 'peach' as const,
    },
    {
      label: 'Day streak',
      value: String(Math.min(stats.sessionsCompleted, 30)),
      hint: 'completed pomodoros',
      icon: Flame,
      tone: 'butter' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} tone={item.tone} className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/85 text-charcoal shadow-soft">
            <item.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-charcoal/55">{item.label}</p>
            <p className="text-xl font-bold leading-tight">{item.value}</p>
            <p className="text-xs text-charcoal/50">{item.hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
