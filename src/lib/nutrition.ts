import RAW from "@/data/bedca-nutrients.json";
import MICROS_RAW from "@/data/bedca-micros.json";

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

/** Índice de búsqueda difusa (exacta sin acentos + solape por palabras con
 *  singular/plural). Reutilizable para macros y micros. */
function buildIndex<T>(obj: Record<string, T>) {
  const entries: { key: string; toks: string[]; val: T }[] = [];
  const exact = new Map<string, T>();
  for (const [name, val] of Object.entries(obj)) {
    const key = strip(name);
    if (key && !exact.has(key)) exact.set(key, val);
    entries.push({ key, toks: tokenize(name), val });
  }
  const memo = new Map<string, T | null>();
  const lookup = (name: string): T | null => {
    const key = strip(name);
    if (!key) return null;
    const ex = exact.get(key);
    if (ex !== undefined) return ex;
    if (memo.has(key)) return memo.get(key) ?? null;
    const qt = key.split(" ").filter((w) => w.length > 2).map(sing);
    let best: T | null = null;
    let bestScore = 0;
    let bestDiff = Infinity;
    if (qt.length) {
      for (const e of entries) {
        if (!e.toks.length) continue;
        let shared = 0;
        for (const t of qt) if (e.toks.includes(t)) shared++;
        if (shared === 0) continue;
        const subset = shared === qt.length || shared === e.toks.length;
        if (!subset) continue;
        const diff = Math.abs(e.toks.length - qt.length);
        if (shared > bestScore || (shared === bestScore && diff < bestDiff)) {
          best = e.val;
          bestScore = shared;
          bestDiff = diff;
        }
      }
    }
    memo.set(key, best);
    return best;
  };
  return { size: entries.length, lookup };
}

const macroIndex = buildIndex<Macro>(RAW as Record<string, Macro>);
export const hasNutrients = macroIndex.size > 0;

export function lookupFood(name: string): Macro | null {
  return macroIndex.lookup(name);
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

/** Un "alimento suelto" en la dieta se guarda como "Nombre (120 g)". Extrae
 *  sus nutrientes si el nombre coincide con BEDCA. */
export function macroForFoodEntry(content: string): Macro {
  const first = String(content || "").split("\n")[0].trim();
  const m = first.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)\s*g\)\s*$/i);
  if (!m) return zeroMacro();
  const grams = parseFloat(m[2].replace(",", "."));
  const f = lookupFood(m[1].trim());
  if (!f || !grams) return zeroMacro();
  const k = grams / 100;
  return { kcal: f.kcal * k, prot: f.prot * k, fat: f.fat * k, carb: f.carb * k, fiber: f.fiber * k };
}

// ---------------- Micronutrientes (BEDCA) ----------------

export type MicroKey =
  | "ca" | "fe" | "mg" | "k" | "p" | "zn"
  | "vitA" | "vitD" | "vitE" | "vitC" | "b1" | "b2" | "b6" | "b12";
export type Micros = Record<MicroKey, number>;

export const MICRO_KEYS: MicroKey[] = ["ca", "fe", "mg", "k", "p", "zn", "vitA", "vitD", "vitE", "vitC", "b1", "b2", "b6", "b12"];
export const MICRO_LABELS: Record<MicroKey, string> = {
  ca: "Calcio", fe: "Hierro", mg: "Magnesio", k: "Potasio", p: "Fósforo", zn: "Zinc",
  vitA: "Vitamina A", vitD: "Vitamina D", vitE: "Vitamina E", vitC: "Vitamina C",
  b1: "Tiamina (B1)", b2: "Riboflavina (B2)", b6: "Vitamina B6", b12: "Vitamina B12",
};
export const MICRO_UNITS: Record<MicroKey, string> = {
  ca: "mg", fe: "mg", mg: "mg", k: "mg", p: "mg", zn: "mg",
  vitA: "µg", vitD: "µg", vitE: "mg", vitC: "mg", b1: "mg", b2: "mg", b6: "mg", b12: "µg",
};
// Valores de referencia de nutrientes (VRN, Reglamento UE 1169/2011), por día.
export const MICRO_DDR: Record<MicroKey, number> = {
  ca: 800, fe: 14, mg: 375, k: 2000, p: 700, zn: 10,
  vitA: 800, vitD: 5, vitE: 12, vitC: 80, b1: 1.1, b2: 1.4, b6: 1.4, b12: 2.5,
};

const microIndex = buildIndex<Partial<Micros>>(MICROS_RAW as Record<string, Partial<Micros>>);
export const hasMicros = microIndex.size > 0;
export const zeroMicros = (): Micros => ({ ca: 0, fe: 0, mg: 0, k: 0, p: 0, zn: 0, vitA: 0, vitD: 0, vitE: 0, vitC: 0, b1: 0, b2: 0, b6: 0, b12: 0 });

export function addMicros(a: Micros, b: Partial<Micros>): Micros {
  const out = { ...a };
  for (const k of MICRO_KEYS) out[k] += b[k] ?? 0;
  return out;
}
function scaleMicros(m: Partial<Micros>, factor: number): Partial<Micros> {
  const out: Partial<Micros> = {};
  for (const k of MICRO_KEYS) if (m[k] != null) out[k] = (m[k] as number) * factor;
  return out;
}
export function microsForIngredients(ings: { name: string; amount: string }[]): Micros {
  let acc = zeroMicros();
  for (const ing of ings) {
    const g = gramsOf(ing.amount);
    if (!g) continue;
    const m = microIndex.lookup(ing.name);
    if (!m) continue;
    acc = addMicros(acc, scaleMicros(m, g / 100));
  }
  return acc;
}
export function microsForFoodEntry(content: string): Micros {
  const first = String(content || "").split("\n")[0].trim();
  const mm = first.match(/^(.+?)\s*\((\d+(?:[.,]\d+)?)\s*g\)\s*$/i);
  if (!mm) return zeroMicros();
  const grams = parseFloat(mm[2].replace(",", "."));
  const m = microIndex.lookup(mm[1].trim());
  if (!m || !grams) return zeroMicros();
  return addMicros(zeroMicros(), scaleMicros(m, grams / 100));
}
