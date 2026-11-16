/**
 * Pure SVG bar chart — no chart library. Values scale to the tallest bar;
 * zero-height bars stay visible as a 2px stub so empty days still read.
 */
export default function BarChart({
  values,
  labels,
  accent = "var(--sage)",
  height = 140,
  ariaLabel = "bar chart",
}: {
  values: number[];
  labels: string[];
  accent?: string;
  height?: number;
  ariaLabel?: string;
}) {
  const max = Math.max(1, ...values);
  const barW = 34;
  const gap = 12;
  const labelH = 20;
  const width = values.length * barW + (values.length + 1) * gap;
  const chartH = height - labelH;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ maxWidth: width }}
    >
      {values.map((v, i) => {
        const h = Math.max(2, (v / max) * (chartH - 10));
        const x = gap + i * (barW + gap);
        const y = chartH - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={6}
              fill={v > 0 ? accent : "var(--cream)"}
            />
            <text
              x={x + barW / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="10"
              fill="var(--wall)"
            >
              {v > 0 ? v : ""}
            </text>
            <text
              x={x + barW / 2}
              y={chartH + 14}
              textAnchor="middle"
              fontSize="11"
              fill="var(--wood)"
            >
              {labels[i] ?? ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
