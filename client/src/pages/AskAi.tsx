import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { ConfidenceBadge, RedFlagCard, OpportunityCard, LoadingState } from "../components/shared";
import type { AiAnswer } from "../api/types";

interface Turn {
  question: string;
  answer: AiAnswer;
}

export function AskAi() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ prompts: string[] }>("/ai/suggested-prompts").then(({ prompts }) => setPrompts(prompts));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading]);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setQuestion("");
    try {
      const { answer } = await api.post<{ answer: AiAnswer }>("/ai/ask", { question: q });
      setTurns((t) => [...t, { question: q, answer }]);
    } finally {
      setLoading(false);
    }
  }

  async function askForBrief() {
    if (loading) return;
    setLoading(true);
    try {
      const brief = await api.get<{ period: { from: string; to: string }; headline: string; bullets: string[] }>("/brief?bullets=5");
      const answer: AiAnswer = {
        executiveAnswer: brief.bullets[0] ?? "",
        keyNumbers: [],
        whatHappened: "",
        why: "",
        redFlags: [],
        opportunities: [],
        suggestedConsiderations: [],
        takeaways: brief.bullets,
        dataContext: {
          period: brief.period,
          filters: "Your assigned scope",
          dataAsOf: new Date().toISOString(),
          dataSource: "Daily Retail Brief (GET /api/v1/brief)",
          confidence: "high",
          confidenceReason: "Certified KPI definitions.",
        },
      };
      setTurns((t) => [...t, { question: "Give me 5 bullets.", answer }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Ask AI</h1>
        <p className="text-sm text-slate-500 mb-3">
          Rule-based conversational analytics over the certified KPI layer — no hosted LLM key is configured in this
          environment (see docs/ROADMAP.md). Answers only use certified KPIs and your permitted data scope.
        </p>
      </div>

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={askForBrief}
            className="text-xs bg-accent/10 hover:bg-accent/20 text-accent font-medium px-3 py-2 rounded-full cursor-pointer min-h-[36px]"
          >
            Give me 5 bullets (Daily Brief)
          </button>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => ask(p)}
              className="text-xs bg-muted hover:bg-border text-slate-700 px-3 py-2 rounded-full cursor-pointer min-h-[36px]"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <div className="bg-primary text-primary-on text-sm rounded-2xl rounded-br-sm px-4 py-2 max-w-[85%]">{t.question}</div>
            </div>
            <AnswerCard answer={t.answer} />
          </div>
        ))}
        {loading && <LoadingState />}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about performance, red flags, or opportunities…"
          className="flex-1 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[44px]"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-on px-5 rounded-full text-sm font-medium cursor-pointer disabled:opacity-50 min-h-[44px]"
        >
          Ask
        </button>
      </form>
    </div>
  );
}

function AnswerCard({ answer }: { answer: AiAnswer }) {
  return (
    <div className="bg-surface border border-border rounded-2xl rounded-bl-sm p-4 space-y-3 max-w-[95%]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{answer.executiveAnswer}</p>
        <ConfidenceBadge confidence={answer.dataContext.confidence} reason={answer.dataContext.confidenceReason} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {answer.keyNumbers.map((k) => (
          <div key={k.label} className="bg-muted/60 rounded-md px-2.5 py-1.5">
            <p className="text-[10px] text-slate-500 uppercase">{k.label}</p>
            <p className="text-sm font-mono font-medium text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {answer.why && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">Why</p>
          <p className="text-sm text-slate-700">{answer.why}</p>
        </div>
      )}

      {answer.redFlags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Red Flags</p>
          <div className="space-y-2">
            {answer.redFlags.map((f) => (
              <RedFlagCard key={f.id} flag={f} />
            ))}
          </div>
        </div>
      )}

      {answer.opportunities.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Opportunities</p>
          <div className="space-y-2">
            {answer.opportunities.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} />
            ))}
          </div>
        </div>
      )}

      {answer.suggestedConsiderations.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase">Suggested Manager Considerations</p>
          <ul className="text-sm text-slate-700 list-disc pl-5">
            {answer.suggestedConsiderations.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase">Takeaways</p>
        <ul className="text-sm text-slate-700 list-disc pl-5">
          {answer.takeaways.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="text-[11px] text-slate-400 border-t border-border pt-2 flex flex-wrap gap-x-3 gap-y-0.5">
        <span>Period: {answer.dataContext.period.from} → {answer.dataContext.period.to}</span>
        <span>Filters: {answer.dataContext.filters}</span>
        <span>Source: {answer.dataContext.dataSource}</span>
      </div>
    </div>
  );
}
