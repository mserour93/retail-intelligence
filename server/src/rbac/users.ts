import { areas, stores } from "../data/masters.js";

export type Role =
  | "CEO"
  | "RETAIL_DIRECTOR"
  | "AREA_MANAGER"
  | "STORE_MANAGER"
  | "COMMERCIAL_DIRECTOR"
  | "CATEGORY_MANAGER";

export interface AppUser {
  id: string;
  name: string;
  role: Role;
  /** undefined = unrestricted (CEO/Retail Director/Commercial roles see everything they're entitled to by role) */
  areaIds?: string[];
  storeIds?: string[];
  categoryIds?: string[];
}

export const USERS: AppUser[] = [
  { id: "user-ceo", name: "Noura Al-Otaibi", role: "CEO" },
  { id: "user-director", name: "Khalid Al-Harbi", role: "RETAIL_DIRECTOR" },
  { id: "user-ahmed", name: "Ahmed Al-Qahtani", role: "AREA_MANAGER", areaIds: ["area-riyadh"] },
  { id: "user-lina", name: "Lina Abdullah", role: "AREA_MANAGER", areaIds: ["area-jeddah"] },
  { id: "user-faisal", name: "Faisal Al-Dosari", role: "AREA_MANAGER", areaIds: ["area-dammam"] },
  {
    id: "user-store-004",
    name: "Reem Al-Shammari",
    role: "STORE_MANAGER",
    areaIds: ["area-riyadh"],
    storeIds: ["store-004"],
  },
  {
    id: "user-store-006",
    name: "Sara Al-Ghamdi",
    role: "STORE_MANAGER",
    areaIds: ["area-jeddah"],
    storeIds: ["store-006"],
  },
  { id: "user-commercial", name: "Yousef Al-Zahrani", role: "COMMERCIAL_DIRECTOR" },
  {
    id: "user-category-otc",
    name: "Maha Al-Rashid",
    role: "CATEGORY_MANAGER",
    categoryIds: ["cat-otc", "cat-personal-care"],
  },
];

export function getUserById(id: string): AppUser | undefined {
  return USERS.find((u) => u.id === id);
}

/** Resolves a user's allowed area IDs. Empty/undefined = all areas for roles entitled to see everything. */
export function allowedAreaIds(user: AppUser): string[] {
  if (user.areaIds && user.areaIds.length) return user.areaIds;
  if (user.role === "AREA_MANAGER" || user.role === "STORE_MANAGER") return [];
  return areas.map((a) => a.id);
}

export function allowedStoreIds(user: AppUser): string[] {
  if (user.storeIds && user.storeIds.length) return user.storeIds;
  const areaIds = allowedAreaIds(user);
  return stores.filter((s) => areaIds.includes(s.areaId)).map((s) => s.id);
}

export function allowedCategoryIds(user: AppUser): string[] | undefined {
  // undefined = no category restriction
  return user.categoryIds && user.categoryIds.length ? user.categoryIds : undefined;
}

/** True if the user is entitled to see the given store, given their role scope. */
export function canAccessStore(user: AppUser, storeId: string): boolean {
  return allowedStoreIds(user).includes(storeId);
}

export function canAccessArea(user: AppUser, areaId: string): boolean {
  const allowed = allowedAreaIds(user);
  return allowed.length === 0 ? false : allowed.includes(areaId);
}
