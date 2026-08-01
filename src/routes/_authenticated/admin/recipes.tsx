import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ChevronDown, Copy, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEALS, type MealId } from "@/lib/domain";
import { ensureIngredients, renderIngredients, type Ingredient } from "@/lib/recipes";

type Recipe = {
  id: string;
  meal: MealId;
  title: string;
  content: string;
  ingredients: Ingredient[];
  created_by: string | null;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/admin/recipes")({
  head: () => ({ meta: [{ title: "Recetas — Admin" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const [openMeal, setOpenMeal] = useState<MealId | null>(null);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/admin/patients"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Pacientes
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recetas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Organiza recetas por tipo de comida. Estas recetas aparecerán como opciones al construir la dieta de un paciente.
          </p>
        </div>

        <div className="space-y-3">
          {MEALS.map((m) => (
            <MealSection
              key={m.id}
              meal={m.id}
              label={m.label}
              emoji={m.emoji}
              open={openMeal === m.id}
              onToggle={() => setOpenMeal(openMeal === m.id ? null : m.id)}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function MealSection({
  meal,
  label,
  emoji,
  open,
  onToggle,
}: {
  meal: MealId;
  label: string;
  emoji: string;
  open: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "" }]);
  const [saving, setSaving] = useState(false);

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", meal],
    enabled: open,
    queryFn: async () => {
      const { data, error } = (await supabase
        .from("recipes")
        .select("id, meal, title, content, ingredients, created_by, created_at")
        .eq("meal", meal)
        .order("title")) as { data: Recipe[] | null; error: Error | null };
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, ingredients: ensureIngredients(r.ingredients) }));
    },
  });

  async function addRecipe() {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("recipes").insert({
      meal,
      title: title.trim(),
      content: "",
      ingredients: ingredients.filter((i) => i.name.trim() || i.amount.trim()),
      created_by: userData.user?.id ?? null,
    } as any);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Receta añadida");
    setTitle("");
    setIngredients([{ name: "", amount: "" }]);
    setAdding(false);
    qc.invalidateQueries({ queryKey: ["recipes", meal] });
    qc.invalidateQueries({ queryKey: ["recipes-all"] });
  }

  async function removeRecipe(id: string) {
    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) {
      toast.error("No se pudo eliminar", { description: error.message });
      return;
    }
    toast.success("Receta eliminada");
    qc.invalidateQueries({ queryKey: ["recipes", meal] });
    qc.invalidateQueries({ queryKey: ["recipes-all"] });
  }

  async function duplicateRecipe(r: Recipe) {
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("recipes").insert({
      meal,
      title: `${r.title} (copia)`,
      content: "",
      ingredients: r.ingredients,
      created_by: userData.user?.id ?? null,
    } as any);
    if (error) {
      toast.error("No se pudo duplicar", { description: error.message });
      return;
    }
    toast.success("Receta duplicada");
    qc.invalidateQueries({ queryKey: ["recipes", meal] });
    qc.invalidateQueries({ queryKey: ["recipes-all"] });
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden>{emoji}</span>
          <div>
            <div className="font-semibold">{label}</div>
            <div className="text-xs text-muted-foreground">
              {recipes?.length ?? 0} recetas
            </div>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border/60 p-5 space-y-4">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : recipes && recipes.length > 0 ? (
            <ul className="space-y-2">
              {recipes.map((r) => (
                <RecipeRow
                  key={r.id}
                  recipe={r}
                  meal={meal}
                  onDelete={() => removeRecipe(r.id)}
                  onDuplicate={() => duplicateRecipe(r)}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin recetas aún.</p>
          )}

          {adding ? (
            <div className="space-y-3 bg-background border border-border rounded-xl p-4">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Tostadas de aguacate" />
              </div>
              <div className="space-y-2">
                <Label>Ingredientes / cantidades</Label>
                {ingredients.map((ing, i) => (
                  <IngredientRow
                    key={i}
                    name={ing.name}
                    amount={ing.amount}
                    onChange={(next) =>
                      setIngredients((prev) => prev.map((p, idx) => (idx === i ? next : p)))
                    }
                    onRemove={() =>
                      setIngredients((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))
                    }
                    canRemove={ingredients.length > 1}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients((prev) => [...prev, { name: "", amount: "" }])}
                >
                  <Plus className="h-4 w-4" /> Añadir línea
                </Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setAdding(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={addRecipe} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Guardar receta
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Añadir receta
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function IngredientRow({
  name,
  amount,
  onChange,
  onRemove,
  canRemove,
}: {
  name: string;
  amount: string;
  onChange: (next: Ingredient) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        value={name}
        onChange={(e) => onChange({ name: e.target.value, amount })}
        placeholder="Ingrediente o paso"
        className="flex-1"
      />
      <Input
        value={amount}
        onChange={(e) => onChange({ name, amount: e.target.value })}
        placeholder="200 / 1 porción"
        inputMode="numeric"
        className="w-36 sm:w-44"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRemove}
        disabled={!canRemove}
        className="shrink-0 h-9 w-9 p-0 text-destructive disabled:opacity-30"
        aria-label="Quitar línea"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function RecipeRow({
  recipe,
  meal,
  onDelete,
  onDuplicate,
}: {
  recipe: Recipe;
  meal: MealId;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(recipe.title);
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("recipes")
      .update({
        title: title.trim(),
        content: "",
        ingredients: ingredients.filter((i) => i.name.trim() || i.amount.trim()),
      } as any)
      .eq("id", recipe.id);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar", { description: error.message });
      return;
    }
    toast.success("Receta actualizada");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["recipes", meal] });
    qc.invalidateQueries({ queryKey: ["recipes-all"] });
  }

  if (editing) {
    return (
      <li className="bg-background/70 border border-border rounded-xl p-4 space-y-3">
        <div className="space-y-1">
          <Label>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Ingredientes / cantidades</Label>
          {ingredients.map((ing, i) => (
            <IngredientRow
              key={i}
              name={ing.name}
              amount={ing.amount}
              onChange={(next) =>
                setIngredients((prev) => prev.map((p, idx) => (idx === i ? next : p)))
              }
              onRemove={() =>
                setIngredients((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))
              }
              canRemove={ingredients.length > 1}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIngredients((prev) => [...prev, { name: "", amount: "" }])}
          >
            <Plus className="h-4 w-4" /> Añadir línea
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => {
              setTitle(recipe.title);
              setIngredients(recipe.ingredients);
              setEditing(false);
            }}
          >
            <X className="h-4 w-4" /> Cancelar
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-start justify-between gap-3 bg-background/60 border border-border rounded-xl p-3">
      <div className="min-w-0 flex-1">
        <div className="font-medium">{recipe.title}</div>
        {recipe.ingredients.length > 0 ? (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{renderIngredients(recipe.ingredients)}</div>
        ) : recipe.content ? (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{recipe.content}</div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label="Editar receta">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate} aria-label="Duplicar receta">
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
          aria-label="Eliminar receta"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}
