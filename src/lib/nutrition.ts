import RAW from "@/data/bedca-nutrients.json";

export type Macro = { kcal: number; prot: number; fat: number; carb: number; fiber: number };

// Normaliza para comparar: minúsculas, sin acentos ni signos.
const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
// Reduce plural -> singular de forma sencilla (solo palabras largas).
const sing = (t: string) => (t.length > 4 ? t.replace(/(es|s)$/, "") : t);
const tokenize = (s: string) =>
  strip(s)
    .split(" ")
    .filter((w) => w.length > 2)
    .map(sing);

type Entry = { key: string; toks: string[]; macro: Macro };
const ENTRIES: Entry[] = [];
const EXACT = new Map<string, Macro>();
for (const [name, macro] of Object.entries(RAW as Record<string, Macro>)) {
  const key = strip(name);
  if (key && !EXACT.has(key)) EXACT.set(key, macro);
  ENTRIES.push({ key, toks: tokenize(name), macro });
}

export const hasNutrients = ENTRIES.length > 0;

const memo = new Map<string, Macro | null>();

/** Busca el alimento BEDCA que mejor encaja con el nombre del ingrediente:
 *  1) coincidencia exacta (sin acentos); 2) mejor solape por palabras donde el
 *  nombre de la receta o el de BEDCA es subconjunto del otro (p. ej. "aceite de
 *  oliva virgen extra" -> "aceite de oliva", "pechuga de pollo" -> "pollo, pechuga"). */
export function lookupFood(name: string): Macro | null {
  const key = strip(name);
  if (!key) return null;
  const ex = EXACT.get(key);
  if (ex) return ex;
  if (memo.has(key)) return memo.get(key) ?? null;

  const qt = key.split(" ").filter((w) => w.length > 2).map(sing);
  let best: Macro | null = null;
  let bestScore = 0;
  let bestDiff = Infinity;
  if (qt.length) {
    for (const e of ENTRIES) {
      if (!e.toks.length) continue;
      let shared = 0;
      for (const t of qt) if (e.toks.includes(t)) shared++;
      if (shared === 0) continue;
      const subset = shared === qt.length || shared === e.toks.length;
      if (!subset) continue;
      const diff = Math.abs(e.toks.length - qt.length);
      if (shared > bestScore || (shared === bestScore && diff < bestDiff)) {
        best = e.macro;
        bestScore = shared;
        bestDiff = diff;
      }
    }
  }
  memo.set(key, best);
  return best;
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
