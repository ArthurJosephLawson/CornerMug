import type { DailyActivityPoint } from '@/services/statsService';

interface ActiveTimeChartProps {
  points: DailyActivityPoint[];
}

function formatDayLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateString.slice(5);
  return date.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' });
}

export function ActiveTimeChart({ points }: ActiveTimeChartProps) {
  const width = 640;
  const height = 180;
  const padX = 28;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const values = points.map((point) => Math.max(0, point.activeSeconds / 60));
  const max = Math.max(1, ...values);

  const coords = points.map((point, index) => {
    const x = padX + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const minutes = Math.max(0, point.activeSeconds / 60);
    const y = padY + innerH - (minutes / max) * innerH;
    return { x, y, minutes, label: formatDayLabel(point.date) };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaBaseline = padY + innerH;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Active time over the last 7 days">
        {/* grid lines */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padY + innerH - ratio * innerH;
          const value = Math.round(max * ratio);
          return (
            <g key={ratio}>
              <line x1={padX} y1={y} x2={padX + innerW} y2={y} stroke="currentColor" className="text-charcoal/10 dark:text-white/20" strokeWidth="1" />
              <text x={4} y={y + 4} fontSize="10" className="fill-charcoal/45 dark:fill-white/75">{value}m</text>
            </g>
          );
        })}

        {coords.length > 1 ? (
          <polyline
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={linePoints}
          />
        ) : null}

        {coords.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#22c55e" />
            <text
              x={point.x}
              y={areaBaseline + 16}
              textAnchor="middle"
              fontSize="11"
              className="fill-charcoal/55 dark:fill-white/75"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
      <p className="mt-1 text-xs text-charcoal/45 dark:text-white/70">
        Daily active time (hangout) tracked from now. Green solid line, last {points.length || 7} days.
      </p>
    </div>
  );
}
