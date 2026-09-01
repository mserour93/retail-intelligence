import { useState } from "react";
import { api } from "../api/client";
import type { Opportunity, RedFlag } from "../api/types";

const DECISIONS: Array<{ value: string; label: string }> = [
  { value: "investigate", label: "I will investigate" },
  { value: "contact_store", label: "I will contact the store" },
  { value: "discuss_category", label: "I will discuss with category team" },
  { value: "review_pricing", label: "I will review pricing" },
  { value: "review_inventory", label: "I will review inventory" },
  { value: "monitor", label: "I will monitor" },
  { value: "not_relevant", label: "Not relevant" },
  { value: "already_handled", label: "Already handled" },
];

export function DecisionModal({
  target,
  onClose,
  onSaved,
}: {
  target: { type: "red_flag" | "opportunity"; item: RedFlag | Opportunity };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [decision, setDecision] = useState(DECISIONS[0].value);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const label = "entityLabel" in target.item ? target.item.entityLabel : "";

  async function save() {
    setSaving(true);
    try {
      await api.post("/actions", { refType: target.type, refId: target.item.id, decision, note });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-lg p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Record a management decision</p>
          <h3 className="text-base font-semibold text-foreground">{label}</h3>
          <p className="text-xs text-slate-400 mt-1">This only records your decision internally — it does not change any business system.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {DECISIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => setDecision(d.value)}
              className={`text-left text-xs px-3 py-2.5 rounded-md border cursor-pointer min-h-[44px] transition-colors ${
                decision === d.value ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-slate-600 hover:bg-muted"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note…"
          className="w-full text-sm border border-border rounded-md p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border text-slate-600 cursor-pointer min-h-[44px]">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-on font-medium cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {saving ? "Saving…" : "Save decision"}
          </button>
        </div>
      </div>
    </div>
  );
}
