import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/auth-hooks";
import { AppShell } from "@/components/app-shell";
import { DAYS, MEALS } from "@/lib/domain";
import { renderMeal } from "@/lib/meal-options";

export const Route = createFileRoute("/_authenticated/patient/day/$day")({
  component: DayPage,
});

function DayPage() {
  const { day } = useParams({ from: "/_authenticated/patient/day/$day" });
  const dayId = Number(day);
  const dayInfo = DAYS.find((d) => d.id === dayId);
  const { data: user } = useCurrentUser();
  const patientId = user?.id;

  const { data: diets } = useQuery({
    queryKey: ["diets", patientId, dayId],
    enabled: !!patientId && !!dayInfo,
    queryFn: async () => {
      const { data } = await supabase
        .from("diets")
        .select("meal, content, week_number")
        .eq("patient_id", patientId!)
        .eq("day_of_week", dayId)
        .order("week_number", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  if (!dayInfo) {
    return (
      <AppShell>
        <p>Día no válido.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          to="/patient"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">Menú del día</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">{dayInfo.label}</h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {MEALS.map((meal) => {
            const row = diets?.find((d) => d.meal === meal.id);
            return (
              <article
                key={meal.id}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-[var(--shadow-soft)] transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl" aria-hidden>{meal.emoji}</span>
                  <h2 className="font-semibold">{meal.label}</h2>
                </div>
                {row?.content ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                    {renderMeal(row.content)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin indicaciones para esta comida.</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
