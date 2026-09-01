import crypto from "node:crypto";

/**
 * Secure share links (spec §49). A token maps to a saved Report Definition;
 * anyone with the link gets a read-only, stamped view — no login needed,
 * but also no access beyond what the report's owner could already see
 * (the report is executed under the owner's RBAC scope, not the viewer's).
 */
export interface ShareLink {
  token: string;
  reportId: string;
  ownerUserId: string;
  createdAt: string;
}

const shares = new Map<string, ShareLink>();

export function createShare(reportId: string, ownerUserId: string): ShareLink {
  const token = crypto.randomBytes(12).toString("base64url");
  const link: ShareLink = { token, reportId, ownerUserId, createdAt: new Date().toISOString() };
  shares.set(token, link);
  return link;
}

export function getShare(token: string): ShareLink | undefined {
  return shares.get(token);
}
