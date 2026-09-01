import { CALENDAR } from "../data/generate.js";
import { computeKpis, type QueryScope } from "../semantic/kpiEngine.js";

/**
 * Naive sales forecast (spec §63, Phase 3 — implemented here as a
 * lightweight, honestly-labeled version, not a machine-learned model).
 * Fits a simple linear trend over the trailing window and extrapolates it
 * forward, with a confidence band from the residual spread. This is a
 * directional estimate only — say so wherever it's shown.
 */
export interface ForecastPoint {
  date: string;
  netSales: number;
  isForecast: boolean;
  lowerBound?: number;
  upperBound?: number;
}

export interface ForecastResult {
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  method: string;
  note: string;
}

const HISTORY_WINDOW_DAYS = 21;
const FORECAST_DAYS = 7;

export function computeForecast(scope: QueryScope): ForecastResult {
  const historyDates = CALENDAR.slice(-HISTORY_WINDOW_DAYS);
  const historyPoints: ForecastPoint[] = historyDates.map((date) => ({
    date,
    netSales: computeKpis({ ...scope, dateFrom: date, dateTo: date }).current.NET_SALES,
    isForecast: false,
  }));

  const n = historyPoints.length;
  const xs = historyPoints.map((_, i) => i);
  const ys = historyPoints.map((p) => p.netSales);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den ? num / den : 0;
  const intercept = yMean - slope * xMean;

  const residuals = ys.map((y, i) => y - (slope * xs[i] + intercept));
  const residualStd = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);

  const lastDate = new Date(historyDates[historyDates.length - 1]);
  const forecast: ForecastPoint[] = Array.from({ length: FORECAST_DAYS }, (_, i) => {
    const x = n + i;
    const predicted = Math.max(0, slope * x + intercept);
    const d = new Date(lastDate);
    d.setUTCDate(d.getUTCDate() + i + 1);
    return {
      date: d.toISOString().slice(0, 10),
      netSales: round2(predicted),
      isForecast: true,
      lowerBound: round2(Math.max(0, predicted - residualStd)),
      upperBound: round2(predicted + residualStd),
    };
  });

  return {
    history: historyPoints.map((p) => ({ ...p, netSales: round2(p.netSales) })),
    forecast,
    method: "naive-linear-trend",
    note: `Naive linear trend fit over the last ${HISTORY_WINDOW_DAYS} days — a directional estimate, not a machine-learned forecast. Treat the shaded range as rough, not precise.`,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
