import type { Role } from "./users.js";

export function roleLabel(role: Role): string {
  return role
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}
