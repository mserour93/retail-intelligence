import { Router } from "express";
import { authMiddleware } from "../rbac/authMiddleware.js";
import { askAi } from "../engines/aiOrchestrator.js";

export const aiRouter = Router();
aiRouter.use(authMiddleware);

aiRouter.post("/ask", (req, res) => {
  const { question } = req.body as { question?: string };
  if (!question || !question.trim()) {
    return res.status(400).json({ error: "question is required" });
  }
  const answer = askAi(question, req.user!);
  res.json({ answer });
});

aiRouter.get("/suggested-prompts", (req, res) => {
  const role = req.user!.role;
  const base = [
    "What should I care about this morning?",
    "Show me the worst-performing stores.",
    "Why is margin down?",
    "What are the biggest opportunities?",
    "Give me a summary for my meeting.",
  ];
  const roleSpecific: Record<string, string[]> = {
    CEO: ["What do I need to care about today?", "Which areas are underperforming and why?"],
    RETAIL_DIRECTOR: ["Which areas are underperforming and why?"],
    AREA_MANAGER: ["Which stores need my attention this morning?", "What should I discuss with store managers?"],
    STORE_MANAGER: ["What are my biggest problems today?"],
    COMMERCIAL_DIRECTOR: ["Which categories need commercial attention?"],
    CATEGORY_MANAGER: ["Which categories are growing but losing margin?"],
  };
  res.json({ prompts: [...(roleSpecific[role] ?? []), ...base] });
});
