import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  KeyRound,
  Loader2,
  Pencil,
  Save,

  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { DocumentsSection } from "@/components/documents-section";
import { RecipeCombobox } from "@/components/recipe-combobox";

import { DAYS, MEALS, type MealId } from "@/lib/domain";
import { parseMeal, serializeMeal, type MealValue } from "@/lib/meal-options";
import { buildDietPdf } from "@/lib/pdf-export";
import { copyWeek, deletePatient, resetPatientPassword } from "@/lib/patients.functions";
import { cn } from "@/lib/utils";
import { ensureIngredients, renderIngredients, type Ingredient } from "@/lib/recipes";

export const Route = createFileRoute("/_authenticated/admin/patients/$id")({
  component: PatientDetail,
});

function PatientDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/patients/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const resetPw = useServerFn(resetPatientPassword);
  const delPatient = useServerFn(deletePatient);

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return <AppShell><div className="text-muted-foreground">Cargando…</div></AppShell>;
  }
  if (!patient) {
    return <AppShell><div>Paciente no encontrado.</div></AppShell>;
  }

  async function handleReset() {
    try {
      const res = await resetPw({ data: { patient_id: id } });
      navigator.clipboard.writeText(res.tempPassword).catch(() => {});
      toast.success("Contraseña restablecida", {
        description: `Nueva contraseña temporal: ${res.tempPassword} (copiada al portapapeles)`,
      });
    } catch (e: any) {
      toast.error("Error", { description: e?.message });
    }
  }

  async function handleDelete() {
    try {
      await delPatient({ data: { patient_id: id } });
      toast.success("Paciente eliminado");
      qc.invalidateQueries({ queryKey: ["patients-list"] });
      navigate({ to: "/admin/patients" });
    } catch (e: any) {
      toast.error("Error", { description: e?.message });
    }
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: "/admin/patients" })}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Pacientes
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary-soft text-primary flex items-center justify-center font-medium text-lg">
            {(patient.first_name?.[0] ?? "") + (patient.last_name?.[0] ?? "")}
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <KeyRound className="h-4 w-4" /> Nueva contraseña
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminarán su usuario, dietas e historial. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="diet">
        <TabsList>
          <TabsTrigger value="diet">Dieta</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="profile">Ficha</TabsTrigger>
        </TabsList>

        <TabsContent value="diet" className="mt-6">
          <DietEditor patientId={id} patientName={`${patient.first_name} ${patient.last_name}`} />
        </TabsContent>
        <TabsContent value="documents" className="mt-6">
          <DocumentsSection patientId={id} canManage />
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <ProfileEditor patient={patient} />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

// ---------- Diet editor ----------
type RecipeOpt = { id: string; meal: string; title: string; content: string; ingredients: Ingredient[] };

function AutoResizeTextarea(props: React.ComponentProps<typeof Textarea>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return (
    <Textarea
      {...props}
      ref={ref}
      rows={1}
      className={cn("resize-none min-h-0 overflow-hidden", props.className)}
      onChange={(e) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
        props.onChange?.(e);
      }}
    />
  );
}

function DietEditor({ patientId, patientName }: { patientId: string; patientName: string }) {
  const [week, setWeek] = useState(1);
  const [activeDay, setActiveDay] = useState<number>(DAYS[0].id);
  // rows keyed by `${day}-${meal}` → MealValue (varias opciones de menú unidas por Y / O)
  const [rows, setRows] = useState<Record<string, MealValue>>({});
  const [saving, setSaving] = useState(false);
  const [copyFrom, setCopyFrom] = useState("");
  /** Recetas nuevas pendientes de guardar en la base de datos: clave `${day}-${meal}-${index}` → título */
  const [pendingNew, setPendingNew] = useState<Record<string, string>>({});
  const copyWeekFn = useServerFn(copyWeek);
  const qc = useQueryClient();

  const { data: recipes } = useQuery({
    queryKey: ["recipes-all"],
    queryFn: async () => {
      const { data } = (await supabase
        .from("recipes")
        .select("id, meal, title, content, ingredients")
        .order("title")) as { data: any[] | null };
      return (data ?? []).map((r) => ({
        id: r.id,
        meal: r.meal,
        title: r.title,
        content: r.content || renderIngredients(ensureIngredients(r.ingredients)),
        ingredients: ensureIngredients(r.ingredients),
      })) as RecipeOpt[];
    },
  });

  const recipesByMeal = (recipes ?? []).reduce<Record<string, RecipeOpt[]>>((acc, r) => {
    (acc[r.meal] ||= []).push(r);
    return acc;
  }, {});

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["diets-admin", patientId, week],
    queryFn: async () => {
      const { data } = await supabase
        .from("diets")
        .select("day_of_week, meal, content")
        .eq("patient_id", patientId)
        .eq("week_number", week);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!recipes) return;
    const map: Record<string, MealValue> = {};
    for (const r of data ?? []) {
      map[`${r.day_of_week}-${r.meal}`] = parseMeal(
        r.content ?? "",
        (c) => recipes.find((rec) => rec.meal === r.meal && rec.content === c)?.id ?? "",
      );
    }
    setRows(map);
  }, [data, recipes]);

  function getCell(key: string): MealValue {
    return rows[key] ?? { options: [{ recipeId: "", content: "" }], joiners: [] };
  }

  function update(key: string, fn: (v: MealValue) => MealValue) {
    setRows((r) => ({ ...r, [key]: fn(r[key] ?? { options: [{ recipeId: "", content: "" }], joiners: [] }) }));
  }

  async function save() {
    setSaving(true);
    const payload: Array<{
      patient_id: string;
      week_number: number;
      day_of_week: number;
      meal: MealId;
      content: string;
    }> = [];
    const deletes: Promise<unknown>[] = [];
    for (const d of DAYS) {
      for (const m of MEALS) {
        const key = `${d.id}-${m.id}`;
        const content = rows[key] ? serializeMeal(rows[key]) : "";
        if (content.trim()) {
          payload.push({
            patient_id: patientId,
            week_number: week,
            day_of_week: d.id,
            meal: m.id,
            content,
          });
        } else {
          deletes.push(
            (async () => {
              await supabase
                .from("diets")
                .delete()
                .eq("patient_id", patientId)
                .eq("week_number", week)
                .eq("day_of_week", d.id)
                .eq("meal", m.id);
            })(),
          );
        }
      }
    }
    await Promise.all(deletes);
    if (payload.length) {
      const { error } = await supabase
        .from("diets")
        .upsert(payload, { onConflict: "patient_id,week_number,day_of_week,meal" });
      if (error) {
        toast.error("Error al guardar", { description: error.message });
        setSaving(false);
        return;
      }
    }
    toast.success("Dieta guardada");
    qc.invalidateQueries({ queryKey: ["diets-admin", patientId, week] });
    setSaving(false);
  }

  async function handleCopyWeek() {
    const from = Number(copyFrom);
    if (!from || from === week) {
      toast.error("Introduce una semana de origen distinta");
      return;
    }
    try {
      const res = await copyWeekFn({ data: { patient_id: patientId, from_week: from, to_week: week } });
      toast.success(`${res.copied} comidas copiadas`);
      refetch();
    } catch (e: any) {
      toast.error("Error", { description: e?.message });
    }
  }

  async function exportPdf() {
    try {
      const { data } = await supabase
        .from("diets")
        .select("day_of_week, meal, content")
        .eq("patient_id", patientId)
        .eq("week_number", week);
      await buildDietPdf({
        patientName,
        weekNumber: week,
        rows: (data ?? []) as any,
      });
      toast.success("PDF generado");
    } catch (e: any) {
      toast.error("Error al generar PDF", { description: e?.message });
    }
  }

  function dayFilled(dayId: number) {
    return MEALS.some((m) => serializeMeal(getCell(`${dayId}-${m.id}`)).trim());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Semana</Label>
          <Input
            type="number"
            min={1}
            value={week}
            onChange={(e) => setWeek(Math.max(1, Number(e.target.value) || 1))}
            className="w-24"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Copiar de semana…"
            value={copyFrom}
            onChange={(e) => setCopyFrom(e.target.value)}
            className="w-40"
            type="number"
          />
          <Button variant="outline" size="sm" onClick={handleCopyWeek}>
            <Copy className="h-4 w-4" /> Copiar semana
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <Download className="h-4 w-4" /> Exportar PDF
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </div>
      </div>

      {(recipes?.length ?? 0) === 0 && (
        <div className="bg-accent/40 border border-border rounded-2xl p-4 text-sm">
          Aún no hay recetas.{" "}
          <a href="/admin/recipes" className="text-primary underline underline-offset-4">
            Añade recetas
          </a>{" "}
          para poder asignarlas a las dietas.
        </div>
      )}

      {/* Días de la semana */}
      <div className="flex flex-wrap gap-2">
        {DAYS.map((d) => {
          const active = activeDay === d.id;
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => setActiveDay(d.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
                active
                  ? "bg-primary text-primary-foreground border-transparent shadow-[var(--shadow-elevated)]"
                  : "bg-card text-foreground border-border hover:bg-accent/50"
              }`}
            >
              {d.label}
              {dayFilled(d.id) && (
                <span
                  className={`ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    active ? "bg-primary-foreground" : "bg-primary"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando…</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-6">
          <h3 className="font-semibold text-lg">
            Menú de {DAYS.find((d) => d.id === activeDay)?.label}
          </h3>
          {MEALS.map((m) => {
            const key = `${activeDay}-${m.id}`;
            const cell = getCell(key);
            const options = recipesByMeal[m.id] ?? [];
            return (
              <div key={m.id} className="rounded-2xl border border-border/70 bg-background/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <span>{m.emoji}</span> {m.label}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 font-bold"
                      title="Añadir otro menú obligatorio (Y)"
                      onClick={() =>
                        update(key, (v) => ({
                          options: [...v.options, { recipeId: "", content: "" }],
                          joiners: [...v.joiners, "y"],
                        }))
                      }
                    >
                      Y
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 font-bold"
                      title="Añadir menú alternativo (O)"
                      onClick={() =>
                        update(key, (v) => ({
                          options: [...v.options, { recipeId: "", content: "" }],
                          joiners: [...v.joiners, "o"],
                        }))
                      }
                    >
                      O
                    </Button>
                  </div>
                </div>

                {cell.options.map((opt, i) => {
                  const optKey = `${key}-${i}`;
                  const pendingTitle = pendingNew[optKey];
                  const source = options.find((o) => o.id === opt.recipeId);
                  const isCustom =
                    !!pendingTitle || (!!opt.content.trim() && (!source || source.content !== opt.content));
                  const clearPending = () =>
                    setPendingNew((p) => {
                      if (!(optKey in p)) return p;
                      const next = { ...p };
                      delete next[optKey];
                      return next;
                    });
                  return (
                    <div key={i} className="space-y-2">
                      {i > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="h-px flex-1 bg-border" />
                          <button
                            type="button"
                            onClick={() =>
                              update(key, (v) => {
                                const joiners = [...v.joiners];
                                joiners[i - 1] = joiners[i - 1] === "y" ? "o" : "y";
                                return { ...v, joiners };
                              })
                            }
                            className="rounded-full bg-primary-soft text-primary px-3 py-0.5 text-xs font-bold"
                            title="Cambiar entre Y / O"
                          >
                            {cell.joiners[i - 1] === "y" ? "Y" : "O"}
                          </button>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <RecipeCombobox
                              recipes={options}
                              value={opt.recipeId}
                              isCustom={isCustom}
                              customLabel={pendingTitle ?? "Personalizada para este paciente"}
                              onClear={() => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: "" };
                                  return { ...v, options: next };
                                });
                              }}
                              onSelect={(rec) => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: rec.id, content: rec.content };
                                  return { ...v, options: next };
                                });
                              }}
                              onUseLocal={(title) => {
                                clearPending();
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: title };
                                  return { ...v, options: next };
                                });
                              }}
                              onCreate={(title) => {
                                // No se guarda todavía: se limpia la descripción y se pide el comentario
                                setPendingNew((p) => ({ ...p, [optKey]: title }));
                                update(key, (v) => {
                                  const next = [...v.options];
                                  next[i] = { recipeId: "", content: "" };
                                  return { ...v, options: next };
                                });
                              }}
                            />

                            {cell.options.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-9 w-9 p-0 text-destructive"
                                title="Quitar este menú"
                                onClick={() =>
                                  update(key, (v) => ({
                                    options: v.options.filter((_, idx) => idx !== i),
                                    joiners: v.joiners.filter((_, idx) => idx !== (i === 0 ? 0 : i - 1)),
                                  }))
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            {isCustom ? (
                              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium">
                                Personalizada
                              </span>
                            ) : (
                              <span />
                            )}
                            {source && source.content !== opt.content && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  update(key, (v) => {
                                    const next = [...v.options];
                                    next[i] = { recipeId: source.id, content: source.content };
                                    return { ...v, options: next };
                                  })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5" /> Restaurar original
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <AutoResizeTextarea
                            value={opt.content}
                            onChange={(e) =>
                              update(key, (v) => {
                                const next = [...v.options];
                                next[i] = { recipeId: "", content: e.target.value };
                                return { ...v, options: next };
                              })
                            }
                            placeholder="Ingredientes, cantidades y preparación…"
                          />
                          {pendingTitle && (
                            <div className="rounded-xl border border-primary/30 bg-primary-soft/60 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-foreground/80">
                                Agregue el comentario y pulse <strong>Guardar</strong> para que «{pendingTitle}» se
                                almacene en la base de datos.
                              </p>
                              <Button
                                type="button"
                                size="sm"
                                onClick={async () => {
                                  const content = opt.content.trim();
                                  const { data: created, error } = await supabase
                                    .from("recipes")
                                    .insert({
                                      meal: m.id,
                                      title: pendingTitle,
                                      content,
                                      ingredients: content
                                        ? content
                                            .split("\n")
                                            .filter((l) => l.trim())
                                            .map((l) => ({ name: l.trim(), amount: "" }))
                                        : [],
                                    } as any)
                                    .select("id")
                                    .single();
                                  if (error) {
                                    toast.error("No se pudo guardar la receta");
                                    return;
                                  }
                                  await qc.invalidateQueries({ queryKey: ["recipes-all"] });
                                  toast.success("Receta añadida a la base de datos");
                                  clearPending();
                                  update(key, (v) => {
                                    const next = [...v.options];
                                    next[i] = { recipeId: created!.id, content };
                                    return { ...v, options: next };
                                  });
                                }}
                              >
                                Guardar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}





// ---------- Profile editor ----------
function ProfileEditor({ patient }: { patient: any }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      first_name: String(fd.get("first_name") || ""),
      last_name: String(fd.get("last_name") || ""),
      phone: (fd.get("phone") as string) || null,
      dni: (fd.get("dni") as string) || null,
      address: (fd.get("address") as string) || null,
      birth_date: (fd.get("birth_date") as string) || null,
      sex: (fd.get("sex") as string) === "none" ? null : ((fd.get("sex") as string) || null),

      height: fd.get("height") ? Number(fd.get("height")) : null,
      observations: (fd.get("observations") as string) || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", patient.id);
    setSaving(false);
    if (error) {
      toast.error("Error", { description: error.message });
      return;
    }
    toast.success("Ficha actualizada");
    qc.invalidateQueries({ queryKey: ["patient", patient.id] });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl grid gap-4 sm:grid-cols-2 bg-card border border-border rounded-2xl p-6">
      <div className="space-y-2">
        <Label htmlFor="first_name">Nombre</Label>
        <Input id="first_name" name="first_name" defaultValue={patient.first_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="last_name">Apellidos</Label>
        <Input id="last_name" name="last_name" defaultValue={patient.last_name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <Input id="phone" name="phone" defaultValue={patient.phone ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" defaultValue={(patient as any).dni ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="address">Dirección</Label>
        <Input id="address" name="address" defaultValue={(patient as any).address ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="birth_date">Fecha de nacimiento</Label>
        <Input id="birth_date" name="birth_date" type="date" defaultValue={patient.birth_date ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sex">Sexo</Label>
        <Select name="sex" defaultValue={patient.sex ?? "none"}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="female">Mujer</SelectItem>
            <SelectItem value="male">Hombre</SelectItem>
            <SelectItem value="other">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="height">Altura (cm)</Label>
        <Input id="height" name="height" type="number" step="0.1" defaultValue={patient.height ?? ""} />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="observations">Observaciones / alergias / patologías</Label>
        <Textarea id="observations" name="observations" rows={4} defaultValue={patient.observations ?? ""} />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
