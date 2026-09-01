import type { ReactNode } from "react";
import { TrendDownIcon, TrendUpIcon } from "./icons";
import type { RedFlag, Opportunity } from "../api/types";

export function KpiCard({
  label,
  value,
  changePct,
  changeLabel,
  positiveIsGood = true,
}: {
  label: string;
  value: string;
  changePct?: number;
  changeLabel?: string;
  positiveIsGood?: boolean;
}) {
  const isPositive = (changePct ?? 0) >= 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold font-mono mt-1 text-foreground">{value}</p>
      {changePct !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${isGood ? "text-success" : "text-destructive"}`}>
          {isPositive ? <TrendUpIcon width={14} height={14} /> : <TrendDownIcon width={14} height={14} />}
          <span>
            {(changePct * 100).toFixed(1)}% {changeLabel ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "critical" | "high" | "medium" }) {
  const styles = {
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    high: "bg-accent/10 text-accent border-accent/30",
    medium: "bg-secondary/10 text-secondary border-secondary/30",
  };
  return <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${styles[severity]}`}>{severity}</span>;
}

export function ConfidenceBadge({ confidence, reason }: { confidence: "high" | "medium" | "low"; reason?: string }) {
  const styles = { high: "bg-success/10 text-success", medium: "bg-accent/10 text-accent", low: "bg-destructive/10 text-destructive" };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[confidence]}`} title={reason}>
      {confidence.toUpperCase()} CONFIDENCE
    </span>
  );
}

export function RedFlagCard({ flag, onDecide }: { flag: RedFlag; onDecide?: (flag: RedFlag) => void }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={flag.severity} />
            <span className="text-sm font-semibold text-foreground">{flag.entityLabel}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{flag.kpiLabel}</p>
        </div>
        {flag.estimatedImpactSar !== null && (
          <p className="text-xs font-mono text-destructive whitespace-nowrap">SAR {Math.round(flag.estimatedImpactSar).toLocaleString()}</p>
        )}
      </div>
      <p className="text-sm text-slate-700">{flag.reason}</p>
      {flag.suggestedConsiderations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested manager considerations</p>
          <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
            {flag.suggestedConsiderations.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      {onDecide && (
        <button onClick={() => onDecide(flag)} className="text-xs font-medium text-primary hover:underline cursor-pointer">
          Record a decision →
        </button>
      )}
    </div>
  );
}

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{opportunity.entityLabel}</p>
          <p className="text-xs text-slate-500">{opportunity.title}</p>
        </div>
        {opportunity.estimatedValueSar !== null && (
          <p className="text-xs font-mono text-success whitespace-nowrap">SAR {Math.round(opportunity.estimatedValueSar).toLocaleString()}</p>
        )}
      </div>
      <p className="text-sm text-slate-700">{opportunity.description}</p>
      <div className="flex gap-3 text-[11px] text-slate-500">
        <span>Impact: {opportunity.impact}</span>
        <span>Urgency: {opportunity.urgency}</span>
        <span>Confidence: {opportunity.confidence}</span>
      </div>
    </div>
  );
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6 first:mt-0">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500 bg-muted/50 border border-dashed border-border rounded-lg p-4 text-center">{children}</p>;
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-4">{message}</div>;
}
