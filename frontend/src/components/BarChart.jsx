/** Very small horizontal bar chart (plain HTML/CSS - no chart library needed). */
export default function BarChart({ data, color = 'bg-brand-600', emptyText = 'No data for these filters.' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!data.length || total === 0) return <p className="py-4 text-sm text-muted">{emptyText}</p>;
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between gap-2 text-sm">
            <span className="min-w-0 break-words">{d.label}</span>
            <span className="font-semibold tabular-nums">{d.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-canvas" role="img" aria-label={`${d.label}: ${d.value}`}>
            <div className={`h-full rounded-full ${d.color || color}`} style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
