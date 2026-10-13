import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Copy, LayoutGrid, List, Loader2, Pencil, Plus, Save, Search, Trash2, Utensils, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEALS, type MealId } from "@/lib/domain";
import { ensureIngredients, type Ingredient } from "@/lib/recipes";
import { macrosPer100g, anyKnown, type Macro } from "@/lib/nutrition";
import { cn } from "@/lib/utils";

type Recipe = {
  id: string;
  meal: MealId;
  title: string;
  content: string;
  ingredients: Ingredient[];
  image_path: string | null;
  kcal: number | null;
  prot: number | null;
  fat: number | null;
  carb: number | null;
};

export const Route = createFileRoute("/_authenticated/admin/recipes")({
  head: () => ({ meta: [{ title: "Recetas — Admin" }] }),
  component: RecipesPage,
});

const round1 = (n: number) => Math.round(n * 10) / 10;

// Paleta de macros (coherente con el resto de la app).
const MACRO = { kcal: "#8A6FB0", fat: "#E0A64B", carb: "#E07E4E", prot: "#5E92C9" };

/** URL de la imagen: si es URL externa se usa tal cual; si no, se resuelve del bucket público. */
function recipeImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return supabase.storage.from("recipe-images").getPublicUrl(path).data.publicUrl;
}

/** Macros por 100 g: valores a mano si existen, si no, calculados de los ingredientes. */
function recipeMacros(r: Recipe): { macro: Macro; known: boolean } {
  const manual = r.kcal != null || r.fat != null || r.carb != null || r.prot != null;
  if (manual) {
    return {
      macro: { kcal: r.kcal ?? 0, fat: r.fat ?? 0, carb: r.carb ?? 0, prot: r.prot ?? 0, fiber: 0 },
      known: true,
    };
  }
  return { macro: macrosPer100g(r.ingredients), known: anyKnown(r.ingredients) };
}

/** Categorías guardadas al importar (primera parte de content, antes de " · por autor"). */
function recipeTags(content: string): string[] {
  if (!content) return [];
  const cats = content.split(" · ")[0];
  return cats.split(",").map((c) => c.trim()).filter(Boolean).slice(0, 2);
}

/** Tira estándar de 4 macros "por 100 g" — misma en recetas y (futuro) productos. */
function MacroStrip({ macro }: { macro: Macro }) {
  const items = [
    { label: "Energía", val: Math.round(macro.kcal), unit: "kcal", color: MACRO.kcal },
    { label: "Grasa", val: round1(macro.fat), unit: "g", color: MACRO.fat },
    { label: "H. Carbono", val: round1(macro.carb), unit: "g", color: MACRO.carb },
    { label: "Proteína", val: round1(macro.prot), unit: "g", color: MACRO.prot },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg bg-muted/50 px-1 py-1 text-center">
            <span className="block truncate text-[9px] font-medium" style={{ color: it.color }}>
              {it.label}
            </span>
            <span className="block text-xs font-semibold text-foreground">
              {it.val}
              <span className="text-[9px] font-normal text-muted-foreground"> {it.unit}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-right text-[10px] text-muted-foreground">valores por 100 g</p>
    </div>
  );
}

function RecipeCard({
  r, onEdit, onDuplicate, onDelete,
}: {
  r: Recipe;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const img = recipeImageUrl(r.image_path);
  const { macro, known } = recipeMacros(r);
  const tags = recipeTags(r.content);
  const mealLabel = MEALS.find((m) => m.id === r.meal)?.label ?? r.meal;
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative h-28 w-full bg-muted/40">
        {img ? (
          <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center">
            <Utensils className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
          {mealLabel}
        </span>
        <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
          {[
            { icon: Pencil, fn: onEdit, label: "Editar" },
            { icon: Copy, fn: onDuplicate, label: "Duplicar" },
            { icon: Trash2, fn: onDelete, label: "Eliminar" },
          ].map(({ icon: Icon, fn, label }) => (
            <button
              key={label}
              type="button"
              onClick={fn}
              aria-label={label}
              className="grid h-6 w-6 place-items-center rounded-full bg-card/95 text-muted-foreground shadow-sm transition hover:text-foreground"
            >
              <Icon className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-medium text-foreground" title={r.title}>{r.title}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
        {known ? (
          <MacroStrip macro={macro} />
        ) : (
          <p className="text-[11px] text-muted-foreground">Sin datos nutricionales.</p>
        )}
      </div>
    </div>
  );
}

function RecipeListRow({
  r, onEdit, onDuplicate, onDelete,
}: {
  r: Recipe;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const img = recipeImageUrl(r.image_path);
  const { macro, known } = recipeMacros(r);
  const mealLabel = MEALS.find((m) => m.id === r.meal)?.label ?? r.meal;
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm transition hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted/40">
        {img ? <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" /> : <Utensils className="h-4 w-4 text-muted-foreground/50" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{r.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{mealLabel}</p>
      </div>
      {known && (
        <div className="hidden shrink-0 items-center gap-2 text-[11px] sm:flex">
          <span className="font-semibold" style={{ color: MACRO.kcal }}>{Math.round(macro.kcal)} kcal</span>
          <span style={{ color: MACRO.fat }}>G {round1(macro.fat)}</span>
          <span style={{ color: MACRO.carb }}>HC {round1(macro.carb)}</span>
          <span style={{ color: MACRO.prot }}>P {round1(macro.prot)}</span>
        </div>
      )}
      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        {[
          { icon: Pencil, fn: onEdit, label: "Editar" },
          { icon: Copy, fn: onDuplicate, label: "Duplicar" },
          { icon: Trash2, fn: onDelete, label: "Eliminar" },
        ].map(({ icon: Icon, fn, label }) => (
          <button key={label} type="button" onClick={fn} aria-label={label}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition hover:text-foreground">
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RecipesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState<MealId | "all">("all");
  const [sortBy, setSortBy] = useState<"name" | "kcal">("name");
  const [view, setView] = useState<"card" | "list">("card");
  const [editing, setEditing] = useState<"new" | Recipe | null>(null);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes-all"],
    queryFn: async () => {
      const { data, error } = (await supabase
        .from("recipes")
        .select("id, meal, title, content, ingredients, image_path, kcal, prot, fat, carb")
        .order("title")) as { data: Recipe[] | null; error: Error | null };
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, ingredients: ensureIngredients(r.ingredients) }));
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["recipes-all"] });

  async function duplicate(r: Recipe) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("recipes").insert({
      meal: r.meal, title: `${r.title} (copia)`, content: r.content, ingredients: r.ingredients,
      image_path: r.image_path, kcal: r.kcal, prot: r.prot, fat: r.fat, carb: r.carb,
      created_by: u.user?.id ?? null,
    } as never);
    if (error) return toast.error("No se pudo duplicar", { description: error.message });
    toast.success("Receta duplicada");
    refresh();
  }

  async function remove(r: Recipe) {
    const { error } = await supabase.from("recipes").delete().eq("id", r.id);
    if (error) return toast.error("No se pudo eliminar", { description: error.message });
    toast.success("Receta eliminada");
    refresh();
  }

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const mealIdx = (m: string) => {
      const i = MEALS.findIndex((x) => x.id === m);
      return i < 0 ? 99 : i;
    };
    return (recipes ?? [])
      .filter((r) => mealFilter === "all" || r.meal === mealFilter)
      .filter((r) => !q || r.title.toLowerCase().includes(q))
      .sort((a, b) =>
        sortBy === "kcal"
          ? (b.kcal ?? 0) - (a.kcal ?? 0) || a.title.localeCompare(b.title, "es")
          : mealIdx(a.meal) - mealIdx(b.meal) || a.title.localeCompare(b.title, "es"),
      );
  }, [recipes, search, mealFilter, sortBy]);

  if (editing) {
    return (
      <AppShell>
        <RecipeEditor
          recipe={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => { refresh(); setEditing(null); }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <Link to="/admin/patients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Recetas</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Cargando…" : `${list.length} recetas`} · aparecen como opciones al construir la dieta.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Nueva receta
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar recetas…" className="h-9 pl-9" />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "kcal")}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          >
            <option value="name">Por comida</option>
            <option value="kcal">Por calorías</option>
          </select>
          <div className="flex overflow-hidden rounded-md border border-input">
            <button type="button" onClick={() => setView("card")} aria-label="Vista tarjeta"
              className={cn("grid h-9 w-9 place-items-center", view === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => setView("list")} aria-label="Vista lista"
              className={cn("grid h-9 w-9 place-items-center", view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={mealFilter === "all"} onClick={() => setMealFilter("all")}>Todas</FilterChip>
          {MEALS.map((m) => (
            <FilterChip key={m.id} active={mealFilter === m.id} onClick={() => setMealFilter(m.id)}>
              <span aria-hidden>{m.emoji}</span> {m.label}
            </FilterChip>
          ))}
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Cargando recetas…
          </div>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-sm italic text-muted-foreground">No hay recetas que coincidan.</p>
        ) : view === "card" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {list.map((r) => (
              <RecipeCard key={r.id} r={r} onEdit={() => setEditing(r)} onDuplicate={() => duplicate(r)} onDelete={() => remove(r)} />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {list.map((r) => (
              <RecipeListRow key={r.id} r={r} onEdit={() => setEditing(r)} onDuplicate={() => duplicate(r)} onDelete={() => remove(r)} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RecipeEditor({
  recipe, onCancel, onSaved,
}: {
  recipe: Recipe | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [meal, setMeal] = useState<MealId>(recipe?.meal ?? "almuerzo");
  const [imageUrl, setImageUrl] = useState(recipe?.image_path ?? "");
  const [kcal, setKcal] = useState(recipe?.kcal?.toString() ?? "");
  const [prot, setProt] = useState(recipe?.prot?.toString() ?? "");
  const [fat, setFat] = useState(recipe?.fat?.toString() ?? "");
  const [carb, setCarb] = useState(recipe?.carb?.toString() ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe && recipe.ingredients.length ? recipe.ingredients : [{ name: "", amount: "" }],
  );
  const [saving, setSaving] = useState(false);

  const numOrNull = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return isFinite(n) ? n : null;
  };

  async function save() {
    if (!title.trim()) return toast.error("El título es obligatorio");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      meal, title: title.trim(),
      content: recipe?.content ?? "",
      ingredients: ingredients.filter((i) => i.name.trim() || i.amount.trim()),
      image_path: imageUrl.trim() || null,
      kcal: numOrNull(kcal), prot: numOrNull(prot), fat: numOrNull(fat), carb: numOrNull(carb),
    };
    const res = recipe
      ? await supabase.from("recipes").update(payload as never).eq("id", recipe.id)
      : await supabase.from("recipes").insert({ ...payload, created_by: u.user?.id ?? null } as never);
    setSaving(false);
    if (res.error) return toast.error("No se pudo guardar", { description: res.error.message });
    toast.success(recipe ? "Receta actualizada" : "Receta creada");
    onSaved();
  }

  const preview = recipeImageUrl(imageUrl.trim() || null);
  const macroNums = {
    kcal: numOrNull(kcal) ?? 0, fat: numOrNull(fat) ?? 0, carb: numOrNull(carb) ?? 0, prot: numOrNull(prot) ?? 0, fiber: 0,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{recipe ? "Editar receta" : "Nueva receta"}</h1>
        <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Cerrar"><X className="h-4 w-4" /></Button>
      </div>

      <div className="glass-card space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Tostadas de aguacate" />
          </div>
          <div className="space-y-1">
            <Label>Tipo de comida</Label>
            <select value={meal} onChange={(e) => setMeal(e.target.value as MealId)}
              className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              {MEALS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <Label>Foto (URL)</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          {preview && <img src={preview} alt="" className="mt-2 h-28 w-full rounded-lg object-cover" />}
        </div>

        <div className="space-y-1">
          <Label>Valores nutricionales (por 100 g)</Label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { v: kcal, set: setKcal, ph: "kcal", color: MACRO.kcal },
              { v: prot, set: setProt, ph: "Prot", color: MACRO.prot },
              { v: carb, set: setCarb, ph: "H.C.", color: MACRO.carb },
              { v: fat, set: setFat, ph: "Grasa", color: MACRO.fat },
            ].map((f) => (
              <div key={f.ph} className="space-y-1">
                <span className="block text-[10px] font-medium" style={{ color: f.color }}>{f.ph}</span>
                <Input value={f.v} onChange={(e) => f.set(e.target.value)} inputMode="decimal" placeholder="0" className="h-9" />
              </div>
            ))}
          </div>
          {(kcal || prot || carb || fat) && <div className="mt-2"><MacroStrip macro={macroNums} /></div>}
        </div>

        <div className="space-y-2">
          <Label>Ingredientes</Label>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input value={ing.name} onChange={(e) => setIngredients((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))} placeholder="Ingrediente" className="flex-1" />
              <Input value={ing.amount} onChange={(e) => setIngredients((p) => p.map((x, idx) => idx === i ? { ...x, amount: e.target.value } : x))} placeholder="200 g" className="w-28" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setIngredients((p) => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} className="h-9 w-9 shrink-0 p-0 text-destructive" aria-label="Quitar">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setIngredients((p) => [...p, { name: "", amount: "" }])}>
            <Plus className="h-4 w-4" /> Añadir línea
          </Button>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
