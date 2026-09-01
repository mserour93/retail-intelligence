/**
 * Optional management action tracking (spec §3, §28). Purely a record of
 * what a manager said they'd do about a red flag/opportunity — it never
 * calls out to any operational system (POS/ERP/inventory/pricing).
 */
export type DecisionType =
  | "investigate"
  | "contact_store"
  | "discuss_category"
  | "review_pricing"
  | "review_inventory"
  | "monitor"
  | "not_relevant"
  | "already_handled";

export interface ManagementAction {
  id: string;
  refType: "red_flag" | "opportunity";
  refId: string;
  decision: DecisionType;
  note: string;
  ownerUserId: string;
  assignedToUserId?: string;
  followUpDate?: string;
  status: "open" | "resolved";
  createdDate: string;
}

const actions = new Map<string, ManagementAction>();
let seq = 0;

export function listActions(ownerUserId?: string): ManagementAction[] {
  const all = [...actions.values()];
  return ownerUserId ? all.filter((a) => a.ownerUserId === ownerUserId) : all;
}

export function createAction(input: Omit<ManagementAction, "id" | "createdDate" | "status">): ManagementAction {
  seq += 1;
  const action: ManagementAction = { ...input, id: `action-${seq}`, status: "open", createdDate: new Date().toISOString() };
  actions.set(action.id, action);
  return action;
}

export function updateActionStatus(id: string, status: ManagementAction["status"]): ManagementAction | undefined {
  const existing = actions.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, status };
  actions.set(id, updated);
  return updated;
}
