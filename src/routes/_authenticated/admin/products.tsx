import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, LayoutGrid, List, Loader2, Package, Pencil, Plus, Save, Search, Trash2, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  kind: "alimento" | "producto";
  name: string;
  brand: string | null;
  barcode: string | null;
  image_url: string | null;
  category: string | null;
  kcal: number | null; prot: number | null; fat: number | null; carb: number | null; fiber: number | null;
  sat_fat: number | null; sugars: number | null; salt: number | null;
  nutri_score: string | null;
  source: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/products")({
  head: () => ({ meta: [{ title: "Productos — Admin" }] }),
  component: ProductsPage,
});

const round1 = (n: number) => Math.round(n * 10) / 10;
const MACRO = { kcal: "#8A6FB0", fat: "#E0A64B", carb: "#E07E4E", prot: "#5E92C9" };
const NUTRI: Record<string, string> = { a: "#038141", b: "#85BB2F", c: "#F7AE00", d: "#EE8100", e: "#E63E11" };

function NutriScore({ grade }: { grade: string }) {
  const g = grade.toLowerCase();
  return (
    <span
      className="inline-grid h-6 w-6 place-items-center rounded-md text-xs font-semibold text-white"
      style={{ background: NUTRI[g] ?? "#999" }}
      title={`Nutri-Score ${g.toUpperCase()}`}
    >
      {g.toUpperCase()}
    </span>
  );
}

function MacroStrip({ p }: { p: Product }) {
  const items = [
    { label: "Energía", val: p.kcal != null ? Math.round(p.kcal) : "—", unit: "kcal", color: MACRO.kcal },
    { label: "Grasa", val: p.fat != null ? round1(p.fat) : "—", unit: "g", color: MACRO.fat },
    { label: "H. Carbono", val: p.carb != null ? round1(p.carb) : "—", unit: "g", color: MACRO.carb },
    { label: "Proteína", val: p.prot != null ? round1(p.prot) : "—", unit: "g", color: MACRO.prot },
  ];
  return (
    <div>
      <div className="grid grid-cols-4 gap-1.5">
        {items.map((it) => (
          <div key={it.label} className="rounded-lg bg-muted/50 px-1 py-1 text-center">
            <span className="block truncate text-[9px] font-medium" style={{ color: it.color }}>{it.label}</span>
            <span className="block text-xs font-semibold text-foreground">
              {it.val}<span className="text-[9px] font-normal text-muted-foreground"> {it.unit}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-1 text-right text-[10px] text-muted-foreground">valores por 100 g</p>
    </div>
  );
}

function ProductCard({ p, onEdit, onDelete }: { p: Product; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="relative h-28 w-full bg-muted/40">
        {p.image_url ? (
          <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
        ) : (
          <div className="grid h-full place-items-center">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
        )}
        <span className="absolute left-1.5 top-1.5 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
          {p.kind === "alimento" ? "Alimento" : "Producto"}
        </span>
        {p.nutri_score && <span className="absolute right-1.5 top-1.5"><NutriScore grade={p.nutri_score} /></span>}
        <div className="absolute bottom-1.5 right-1.5 flex gap-1">
          {[{ icon: Pencil, fn: onEdit, label: "Editar" }, { icon: Trash2, fn: onDelete, label: "Eliminar" }].map(({ icon: Icon, fn, label }) => (
            <button key={label} type="button" onClick={fn} aria-label={label}
              className="grid h-7 w-7 place-items-center rounded-full bg-card/95 text-foreground shadow-sm transition hover:bg-primary hover:text-primary-foreground">
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 p-3">
        <div>
          <p className="truncate text-sm font-medium text-foreground" title={p.name}>{p.name}</p>
          {p.brand && <p className="truncate text-[11px] text-muted-foreground">{p.brand}</p>}
        </div>
        <MacroStrip p={p} />
      </div>
    </div>
  );
}

function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "alimento" | "producto">("all");
  const [sortBy, setSortBy] = useState<"name" | "kcal">("name");
  const [view, setView] = useState<"card" | "list">("card");
  const [visible, setVisible] = useState(60);
  const [editing, setEditing] = useState<"new" | Product | null>(null);

  // Búsqueda con rebote (evita una consulta por tecla).
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["products", kindFilter, debounced],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id, kind, name, brand, barcode, image_url, category, kcal, prot, fat, carb, fiber, sat_fat, sugars, salt, nutri_score, source");
      if (kindFilter !== "all") q = q.eq("kind", kindFilter);
      const term = debounced.replace(/[%,()]/g, " ").trim();
      if (term) q = q.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
      const { data, error } = (await q.order("name").limit(300)) as { data: Product[] | null; error: Error | null };
      if (error) throw error;
      return data ?? [];
    },
  });

  // Totales reales (independientes del filtro/búsqueda).
  const { data: counts } = useQuery({
    queryKey: ["products-counts"],
    queryFn: async () => {
      const [t, a, m] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("kind", "alimento"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("kind", "producto"),
      ]);
      return { total: t.count ?? 0, a: a.count ?? 0, m: m.count ?? 0 };
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["products-counts"] });
  };

  async function remove(p: Product) {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return toast.error("No se pudo eliminar", { description: error.message });
    toast.success("Producto eliminado");
    refresh();
  }

  const filtered = useMemo(() => {
    return [...(products ?? [])].sort((a, b) =>
      sortBy === "kcal" ? (b.kcal ?? 0) - (a.kcal ?? 0) || a.name.localeCompare(b.name, "es") : a.name.localeCompare(b.name, "es"),
    );
  }, [products, sortBy]);

  const shown = filtered.slice(0, visible);

  if (editing) {
    return (
      <AppShell>
        <ProductEditor product={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={() => { refresh(); setEditing(null); }} />
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
            <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {`${counts?.total ?? 0} en total · ${counts?.a ?? 0} alimentos · ${counts?.m ?? 0} de marca`} · bloques para componer recetas.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Nuevo producto</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setVisible(60); }} placeholder="Buscar por nombre o marca…" className="h-9 pl-9" />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "name" | "kcal")} className="h-9 rounded-md border border-input bg-card px-2 text-sm">
            <option value="name">Por nombre</option>
            <option value="kcal">Por calorías</option>
          </select>
          <div className="flex overflow-hidden rounded-md border border-input">
            <button type="button" onClick={() => setView("card")} aria-label="Vista tarjeta"
              className={cn("grid h-9 w-9 place-items-center", view === "card" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}><LayoutGrid className="h-4 w-4" /></button>
            <button type="button" onClick={() => setView("list")} aria-label="Vista lista"
              className={cn("grid h-9 w-9 place-items-center", view === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}><List className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip active={kindFilter === "all"} onClick={() => { setKindFilter("all"); setVisible(60); }}>Todos</FilterChip>
          <FilterChip active={kindFilter === "alimento"} onClick={() => { setKindFilter("alimento"); setVisible(60); }}>Alimentos</FilterChip>
          <FilterChip active={kindFilter === "producto"} onClick={() => { setKindFilter("producto"); setVisible(60); }}>Productos de marca</FilterChip>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Cargando productos…</div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm italic text-muted-foreground">No hay productos que coincidan.</p>
        ) : view === "card" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {shown.map((p) => <ProductCard key={p.id} p={p} onEdit={() => setEditing(p)} onDelete={() => remove(p)} />)}
          </div>
        ) : (
          <div className="space-y-1.5">
            {shown.map((p) => <ProductListRow key={p.id} p={p} onEdit={() => setEditing(p)} onDelete={() => remove(p)} />)}
          </div>
        )}

        {filtered.length > shown.length && (
          <div className="pt-2 text-center">
            <Button variant="outline" size="sm" onClick={() => setVisible((v) => v + 60)}>
              Mostrar más ({filtered.length - shown.length} restantes)
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ProductListRow({ p, onEdit, onDelete }: { p: Product; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2 shadow-sm transition hover:shadow-md">
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted/40">
        {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-full w-full object-contain p-0.5" /> : <Package className="h-4 w-4 text-muted-foreground/50" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{p.brand || (p.kind === "alimento" ? "Alimento" : "Producto")}</p>
      </div>
      {p.nutri_score && <NutriScore grade={p.nutri_score} />}
      <div className="hidden shrink-0 items-center gap-2 text-[11px] sm:flex">
        <span className="font-semibold" style={{ color: MACRO.kcal }}>{p.kcal != null ? Math.round(p.kcal) : "—"} kcal</span>
        <span style={{ color: MACRO.fat }}>G {p.fat != null ? round1(p.fat) : "—"}</span>
        <span style={{ color: MACRO.carb }}>HC {p.carb != null ? round1(p.carb) : "—"}</span>
        <span style={{ color: MACRO.prot }}>P {p.prot != null ? round1(p.prot) : "—"}</span>
      </div>
      <div className="flex shrink-0 gap-1">
        {[{ icon: Pencil, fn: onEdit, label: "Editar" }, { icon: Trash2, fn: onDelete, label: "Eliminar" }].map(({ icon: Icon, fn, label }) => (
          <button key={label} type="button" onClick={fn} aria-label={label} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-foreground transition hover:bg-muted"><Icon className="h-3.5 w-3.5" /></button>
        ))}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition", active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
      {children}
    </button>
  );
}

function ProductEditor({ product, onCancel, onSaved }: { product: Product | null; onCancel: () => void; onSaved: () => void }) {
  const [kind, setKind] = useState<"alimento" | "producto">(product?.kind ?? "producto");
  const [name, setName] = useState(product?.name ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [nutri, setNutri] = useState(product?.nutri_score ?? "");
  const [f, setF] = useState({
    kcal: product?.kcal?.toString() ?? "", prot: product?.prot?.toString() ?? "", carb: product?.carb?.toString() ?? "",
    fat: product?.fat?.toString() ?? "", fiber: product?.fiber?.toString() ?? "",
    sat_fat: product?.sat_fat?.toString() ?? "", sugars: product?.sugars?.toString() ?? "", salt: product?.salt?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const numOrNull = (s: string) => { const n = parseFloat(s.replace(",", ".")); return isFinite(n) ? n : null; };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      kind, name: name.trim(), brand: brand.trim() || null, barcode: barcode.trim() || null,
      image_url: imageUrl.trim() || null, nutri_score: nutri || null,
      kcal: numOrNull(f.kcal), prot: numOrNull(f.prot), fat: numOrNull(f.fat), carb: numOrNull(f.carb), fiber: numOrNull(f.fiber),
      sat_fat: numOrNull(f.sat_fat), sugars: numOrNull(f.sugars), salt: numOrNull(f.salt),
    };
    const res = product
      ? await supabase.from("products").update(payload as never).eq("id", product.id)
      : await supabase.from("products").insert({ ...payload, source: "manual", created_by: u.user?.id ?? null } as never);
    setSaving(false);
    if (res.error) return toast.error("No se pudo guardar", { description: res.error.message });
    toast.success(product ? "Producto actualizado" : "Producto creado");
    onSaved();
  }

  const numFields: { k: keyof typeof f; label: string; color?: string }[] = [
    { k: "kcal", label: "Energía (kcal)", color: MACRO.kcal }, { k: "prot", label: "Proteína (g)", color: MACRO.prot },
    { k: "carb", label: "H. Carbono (g)", color: MACRO.carb }, { k: "fat", label: "Grasa (g)", color: MACRO.fat },
    { k: "fiber", label: "Fibra (g)" }, { k: "sat_fat", label: "Grasas sat. (g)" },
    { k: "sugars", label: "Azúcares (g)" }, { k: "salt", label: "Sal (g)" },
  ];
  const preview: Product = { id: "", kind, name, brand: brand || null, barcode: null, image_url: imageUrl || null, category: null, kcal: numOrNull(f.kcal), prot: numOrNull(f.prot), fat: numOrNull(f.fat), carb: numOrNull(f.carb), fiber: null, sat_fat: null, sugars: null, salt: null, nutri_score: nutri || null, source: null };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{product ? "Editar producto" : "Nuevo producto"}</h1>
        <Button variant="ghost" size="sm" onClick={onCancel} aria-label="Cerrar"><X className="h-4 w-4" /></Button>
      </div>
      <div className="glass-card space-y-4 rounded-2xl p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Tipo</Label>
            <select value={kind} onChange={(e) => setKind(e.target.value as "alimento" | "producto")} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="producto">Producto de marca</option>
              <option value="alimento">Alimento genérico</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Nutri-Score</Label>
            <select value={nutri} onChange={(e) => setNutri(e.target.value)} className="h-10 w-full rounded-md border border-input bg-card px-2 text-sm">
              <option value="">— (sin)</option>
              {["a", "b", "c", "d", "e"].map((g) => <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Yogur natural" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1"><Label>Marca</Label><Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Ej. Hacendado" /></div>
          <div className="space-y-1"><Label>Código de barras</Label><Input value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="8410…" /></div>
        </div>
        <div className="space-y-1">
          <Label>Foto (URL)</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
          {imageUrl.trim() && <img src={imageUrl.trim()} alt="" className="mt-2 h-28 w-full rounded-lg object-contain" />}
        </div>
        <div className="space-y-1">
          <Label>Valores nutricionales (por 100 g)</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {numFields.map((nf) => (
              <div key={nf.k} className="space-y-1">
                <span className="block text-[10px] font-medium" style={{ color: nf.color ?? "var(--muted-foreground)" }}>{nf.label}</span>
                <Input value={f[nf.k]} onChange={set(nf.k)} inputMode="decimal" placeholder="0" className="h-9" />
              </div>
            ))}
          </div>
          {(f.kcal || f.prot || f.carb || f.fat) && <div className="mt-2"><MacroStrip p={preview} /></div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button size="sm" onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Guardar</Button>
        </div>
      </div>
    </div>
  );
}
