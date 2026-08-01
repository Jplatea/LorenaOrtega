export type Joiner = "y" | "o";

export type MealOption = { recipeId: string; content: string };

export type MealValue = {
  options: MealOption[];
  joiners: Joiner[]; // length = options.length - 1
};

const SEP_RE = /\n?\[\+(Y|O)\]\n?/g;

/** Parse stored diet content into multiple menu options. */
export function parseMeal(content: string, findRecipeId?: (c: string) => string): MealValue {
  const raw = content ?? "";
  const joiners: Joiner[] = [];
  const parts: string[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  SEP_RE.lastIndex = 0;
  while ((m = SEP_RE.exec(raw))) {
    parts.push(raw.slice(last, m.index));
    joiners.push(m[1] === "Y" ? "y" : "o");
    last = m.index + m[0].length;
  }
  parts.push(raw.slice(last));
  return {
    options: parts.map((c) => ({ recipeId: findRecipeId?.(c) ?? "", content: c })),
    joiners,
  };
}

/** Serialize multiple menu options back into a single stored string. */
export function serializeMeal(value: MealValue): string {
  const opts = value.options.map((o) => o.content);
  if (opts.every((c) => !c.trim())) return "";
  return opts.reduce((acc, c, i) => (i === 0 ? c : `${acc}\n[+${value.joiners[i - 1] === "y" ? "Y" : "O"}]\n${c}`), "");
}

/** Human-readable rendering (patient view / PDF). */
export function renderMeal(content: string): string {
  const { options, joiners } = parseMeal(content ?? "");
  return options
    .map((o, i) => (i === 0 ? o.content.trim() : `— ${joiners[i - 1] === "y" ? "Y" : "O"} —\n${o.content.trim()}`))
    .filter(Boolean)
    .join("\n\n");
}
