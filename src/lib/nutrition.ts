import RAW from "@/data/bedca-nutrients.json";

export type Macro = { kcal: number; prot: number; fat: number; carb: number; fiber: number };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// Mapa nombre-normalizado -> nutrientes por 100 g (datos BEDCA).
const MAP: Map<string, Macro> = new Map(
  Object.entries(RAW as Record<string, Macro>).map(([k, v]) => [norm(k), v]),
);

export const hasNutrients = MAP.size > 0;

export function lookupFood(name: string): Macro | null {
  return MAP.get(norm(name)) ?? null;
}

/** Convierte una cantidad ("200 gr", "150 ml", "30") a gramos. Devuelve null si
 *  no es una cantidad en peso/volumen (p. ej. "1 porción"). */
export function gramsOf(amount: string): number | null {
  const m = String(amount || "").match(/([\d.,]+)\s*(gr|g|ml)?\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (!isFinite(n)) return null;
  const unit = (m[2] || "").toLowerCase();
  if (unit === "" || unit === "gr" || unit === "g" || unit === "ml") return n;
  return null;
}

export const zeroMacro = (): Macro => ({ kcal: 0, prot: 0, fat: 0, carb: 0, fiber: 0 });

export function addMacro(a: Macro, b: Macro): Macro {
  return {
    kcal: a.kcal + b.kcal,
    prot: a.prot + b.prot,
    fat: a.fat + b.fat,
    carb: a.carb + b.carb,
    fiber: a.fiber + b.fiber,
  };
}

/** Suma los nutrientes de una lista de ingredientes {name, amount}. */
export function macrosForIngredients(ings: { name: string; amount: string }[]): Macro {
  const acc = zeroMacro();
  for (const ing of ings) {
    const g = gramsOf(ing.amount);
    if (!g) continue;
    const f = lookupFood(ing.name);
    if (!f) continue;
    const k = g / 100;
    acc.kcal += f.kcal * k;
    acc.prot += f.prot * k;
    acc.fat += f.fat * k;
    acc.carb += f.carb * k;
    acc.fiber += f.fiber * k;
  }
  return acc;
}

/** Gramos totales de una lista de ingredientes (solo los que son peso/volumen). */
export function totalGrams(ings: { name: string; amount: string }[]): number {
  let g = 0;
  for (const ing of ings) g += gramsOf(ing.amount) ?? 0;
  return g;
}

/** Nutrientes por 100 g de la receta (para mostrar en las tarjetas de recetas). */
export function macrosPer100g(ings: { name: string; amount: string }[]): Macro {
  const total = macrosForIngredients(ings);
  const grams = totalGrams(ings);
  if (grams <= 0) return zeroMacro();
  const f = 100 / grams;
  return {
    kcal: total.kcal * f,
    prot: total.prot * f,
    fat: total.fat * f,
    carb: total.carb * f,
    fiber: total.fiber * f,
  };
}

/** ¿Tenemos datos para al menos un ingrediente de la lista? */
export function anyKnown(ings: { name: string; amount: string }[]): boolean {
  return ings.some((i) => lookupFood(i.name) && gramsOf(i.amount));
}
