interface ForecastPoint {
  date: string;
  netSales: number;
  isForecast: boolean;
  lowerBound?: number;
  upperBound?: number;
}

/** Simple inline SVG line chart with a shaded confidence band for the forecast segment. */
export function ForecastChart({ history, forecast }: { history: ForecastPoint[]; forecast: ForecastPoint[] }) {
  const all = [...history, ...forecast];
  if (all.length < 2) return null;

  const width = 600;
  const height = 160;
  const padding = 8;
  const values = all.flatMap((p) => [p.netSales, p.lowerBound ?? p.netSales, p.upperBound ?? p.netSales]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (i: number) => padding + (i / (all.length - 1)) * (width - padding * 2);
  const y = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const historyPath = history.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.netSales)}`).join(" ");
  const forecastStartIdx = history.length - 1;
  const forecastPath = [history[history.length - 1], ...forecast]
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(forecastStartIdx + i)} ${y(p.netSales)}`)
    .join(" ");

  const bandPoints = [
    ...forecast.map((p, i) => `${x(forecastStartIdx + 1 + i)},${y(p.upperBound ?? p.netSales)}`),
    ...[...forecast].reverse().map((p, i) => `${x(all.length - 1 - i)},${y(p.lowerBound ?? p.netSales)}`),
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none" role="img" aria-label="7-day sales forecast chart">
      <polygon points={bandPoints} fill="#D97706" fillOpacity={0.12} />
      <path d={historyPath} fill="none" stroke="#1E40AF" strokeWidth={2} />
      <path d={forecastPath} fill="none" stroke="#D97706" strokeWidth={2} strokeDasharray="5,4" />
      <circle cx={x(all.length - 1)} cy={y(all[all.length - 1].netSales)} r={3} fill="#D97706" />
    </svg>
  );
}
