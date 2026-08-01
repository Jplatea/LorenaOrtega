export type Ingredient = {
  name: string;
  amount: string;
};

export function renderIngredients(ingredients: Ingredient[]): string {
  return ingredients
    .filter((i) => i.name.trim() || i.amount.trim())
    .map((i) => {
      const name = i.name.trim();
      const amount = i.amount.trim();
      if (!amount) return name;
      if (!name) return amount;
      return `${name} — ${amount}`;
    })
    .join("\n");
}

export function ensureIngredients(value: unknown): Ingredient[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((i) => i && typeof i === "object")
    .map((i) => ({ name: String(i.name ?? ""), amount: String(i.amount ?? "") }));
}
