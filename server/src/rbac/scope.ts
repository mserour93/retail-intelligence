import type { QueryScope } from "../semantic/kpiEngine.js";
import { storesInArea } from "../data/masters.js";
import { allowedAreaIds, allowedCategoryIds, allowedStoreIds, type AppUser } from "./users.js";

/**
 * Intersects a requested query scope with what the user is actually
 * entitled to see (spec §37: "An Area Manager must never be able to ask AI
 * for data outside their assigned area"). Every route and every AI tool
 * call must build its scope through this function — never trust
 * client-supplied storeIds/areaIds/categoryIds directly.
 */
export function enforceScope(user: AppUser, requested: Partial<QueryScope>): QueryScope {
  const userStoreIds = new Set(allowedStoreIds(user));
  const userCategoryIds = allowedCategoryIds(user);

  let storeIds: string[];
  if (requested.storeIds && requested.storeIds.length) {
    storeIds = requested.storeIds.filter((id) => userStoreIds.has(id));
  } else if (requested.areaIds && requested.areaIds.length) {
    const userAreaIds = new Set(allowedAreaIds(user));
    const grantedAreaIds = requested.areaIds.filter((id) => userAreaIds.has(id));
    const areaStoreIds = new Set(grantedAreaIds.flatMap((areaId) => storesInArea(areaId).map((s) => s.id)));
    storeIds = [...userStoreIds].filter((id) => areaStoreIds.has(id));
  } else {
    storeIds = [...userStoreIds];
  }

  let categoryIds = requested.categoryIds;
  if (userCategoryIds) {
    categoryIds = categoryIds && categoryIds.length ? categoryIds.filter((id) => userCategoryIds.includes(id)) : userCategoryIds;
  }

  return {
    dateFrom: requested.dateFrom ?? defaultDateFrom(),
    dateTo: requested.dateTo ?? defaultDateTo(),
    storeIds,
    categoryIds,
  };
}

export function defaultDateTo(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function defaultDateFrom(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 6); // default trailing 7 days
  return d.toISOString().slice(0, 10);
}
