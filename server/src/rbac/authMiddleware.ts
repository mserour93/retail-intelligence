import type { NextFunction, Request, Response } from "express";
import { getUserById, type AppUser } from "./users.js";

/**
 * Mock SSO (spec §37/§40). A real deployment puts an SSO/JWT session here;
 * this environment has no identity provider configured, so the client picks
 * a persona and sends it as `x-user-id`. Every route reads `req.user` from
 * this middleware only — never trust a client-supplied scope directly.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.header("x-user-id");
  if (!userId) {
    res.status(401).json({ error: "Missing x-user-id header. Call GET /api/v1/auth/personas to pick a mock persona." });
    return;
  }
  const user = getUserById(userId);
  if (!user) {
    res.status(401).json({ error: `Unknown user id: ${userId}` });
    return;
  }
  req.user = user;
  next();
}
