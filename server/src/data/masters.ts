export interface Region {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  regionId: string;
  managerUserId: string;
}

export interface Store {
  id: string;
  code: string;
  name: string;
  areaId: string;
  cluster: "Flagship" | "Standard" | "Express";
  managerUserId: string;
  sqm: number;
}

export type StrategicRole =
  | "Traffic Driver"
  | "Margin Driver"
  | "Basket Builder"
  | "Destination"
  | "Seasonal"
  | "Strategic Growth"
  | "Defensive"
  | "Emerging";

export interface Category {
  id: string;
  name: string;
  strategicRole: StrategicRole;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  brand: string;
  price: number;
  isTopSeller: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  categoryIds: string[];
}

export const regions: Region[] = [
  { id: "reg-central", name: "Central Region" },
  { id: "reg-west", name: "Western Region" },
  { id: "reg-east", name: "Eastern Region" },
];

export const areas: Area[] = [
  { id: "area-riyadh", name: "Riyadh", regionId: "reg-central", managerUserId: "user-ahmed" },
  { id: "area-jeddah", name: "Jeddah", regionId: "reg-west", managerUserId: "user-lina" },
  { id: "area-dammam", name: "Dammam", regionId: "reg-east", managerUserId: "user-faisal" },
];

const storeSeeds: Array<[string, string, "Flagship" | "Standard" | "Express", number]> = [
  ["area-riyadh", "Olaya", "Flagship", 420],
  ["area-riyadh", "Malaz", "Standard", 260],
  ["area-riyadh", "Nakheel", "Standard", 240],
  ["area-riyadh", "Sahafa", "Express", 120],
  ["area-riyadh", "Rawdah", "Express", 110],
  ["area-jeddah", "Corniche", "Flagship", 400],
  ["area-jeddah", "Rawdah Jeddah", "Standard", 250],
  ["area-jeddah", "Salamah", "Standard", 230],
  ["area-jeddah", "Hamra", "Express", 115],
  ["area-dammam", "Faisaliyah", "Flagship", 380],
  ["area-dammam", "Shatea", "Standard", 245],
  ["area-dammam", "Rakah", "Express", 118],
];

export const stores: Store[] = storeSeeds.map(([areaId, name, cluster, sqm], idx) => {
  const code = (idx + 1).toString().padStart(3, "0");
  return {
    id: `store-${code}`,
    code,
    name: `${name} Pharmacy`,
    areaId,
    cluster,
    managerUserId: `user-store-${code}`,
    sqm,
  };
});

export const categories: Category[] = [
  { id: "cat-otc", name: "OTC", strategicRole: "Traffic Driver" },
  { id: "cat-rx", name: "Rx / Pharmacy", strategicRole: "Destination" },
  { id: "cat-vitamins", name: "Vitamins & Supplements", strategicRole: "Margin Driver" },
  { id: "cat-beauty", name: "Beauty", strategicRole: "Strategic Growth" },
  { id: "cat-personal-care", name: "Personal Care", strategicRole: "Basket Builder" },
  { id: "cat-devices", name: "Medical Devices", strategicRole: "Defensive" },
];

const productSeeds: Array<[string, string, string, number, boolean]> = [
  ["cat-otc", "Panadol Extra 24s", "Panadol", 14.5, true],
  ["cat-otc", "Strepsils Honey Lemon", "Strepsils", 9.0, true],
  ["cat-otc", "Fess Nasal Spray", "Fess", 22.0, false],
  ["cat-otc", "Cetal Cold & Flu", "Cetal", 12.0, true],
  ["cat-rx", "Amoxil 500mg", "Amoxil", 18.0, true],
  ["cat-rx", "Glucophage 500mg", "Glucophage", 15.0, true],
  ["cat-rx", "Concor 5mg", "Concor", 24.0, false],
  ["cat-rx", "Ventolin Inhaler", "Ventolin", 19.5, true],
  ["cat-vitamins", "Centrum Silver 60s", "Centrum", 89.0, true],
  ["cat-vitamins", "Vitamin D3 5000IU", "Nature's Bounty", 45.0, true],
  ["cat-vitamins", "Omega-3 Fish Oil", "Nature Made", 65.0, false],
  ["cat-vitamins", "Collagen Powder", "Vital Proteins", 120.0, false],
  ["cat-beauty", "Cetaphil Gentle Cleanser", "Cetaphil", 55.0, true],
  ["cat-beauty", "La Roche-Posay Sunscreen", "La Roche-Posay", 95.0, true],
  ["cat-beauty", "Nivea Body Lotion", "Nivea", 28.0, false],
  ["cat-beauty", "Vichy Mineral Water", "Vichy", 42.0, false],
  ["cat-personal-care", "Sensodyne Toothpaste", "Sensodyne", 16.0, true],
  ["cat-personal-care", "Dettol Hand Sanitizer", "Dettol", 8.5, true],
  ["cat-personal-care", "Johnson's Baby Shampoo", "Johnson's", 19.0, false],
  ["cat-personal-care", "Oral-B Toothbrush", "Oral-B", 12.5, false],
  ["cat-devices", "Omron Blood Pressure Monitor", "Omron", 195.0, true],
  ["cat-devices", "Accu-Chek Glucometer", "Accu-Chek", 145.0, true],
  ["cat-devices", "Digital Thermometer", "Braun", 65.0, false],
  ["cat-devices", "Pulse Oximeter", "Beurer", 89.0, false],
];

export const products: Product[] = productSeeds.map(([categoryId, name, brand, price, isTopSeller], idx) => ({
  id: `prod-${idx + 1}`,
  sku: `SKU${(10000 + idx).toString()}`,
  name,
  categoryId,
  brand,
  price,
  isTopSeller,
}));

export const suppliers: Supplier[] = [
  { id: "sup-gsk", name: "GSK Arabia", categoryIds: ["cat-otc"] },
  { id: "sup-pfizer", name: "Pfizer Gulf", categoryIds: ["cat-rx"] },
  { id: "sup-haleon", name: "Haleon Distribution", categoryIds: ["cat-otc", "cat-personal-care"] },
  { id: "sup-nature", name: "NatureWell Trading", categoryIds: ["cat-vitamins"] },
  { id: "sup-loreal", name: "L'Oreal KSA", categoryIds: ["cat-beauty"] },
  { id: "sup-omron", name: "Omron Gulf", categoryIds: ["cat-devices"] },
];

export function getAreaById(id: string) {
  return areas.find((a) => a.id === id);
}
export function getStoreById(id: string) {
  return stores.find((s) => s.id === id);
}
export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}
export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}
export function storesInArea(areaId: string) {
  return stores.filter((s) => s.areaId === areaId);
}
export function productsInCategory(categoryId: string) {
  return products.filter((p) => p.categoryId === categoryId);
}
