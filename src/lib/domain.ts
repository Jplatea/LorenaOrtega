export const DAYS = [
  { id: 1, label: "Lunes", short: "Lun" },
  { id: 2, label: "Martes", short: "Mar" },
  { id: 3, label: "Miércoles", short: "Mié" },
  { id: 4, label: "Jueves", short: "Jue" },
  { id: 5, label: "Viernes", short: "Vie" },
  { id: 6, label: "Sábado", short: "Sáb" },
  { id: 7, label: "Domingo", short: "Dom" },
] as const;

export const MEALS = [
  { id: "desayuno", label: "Desayuno", emoji: "🌅" },
  { id: "media_manana", label: "Media mañana", emoji: "🍎" },
  { id: "almuerzo", label: "Almuerzo", emoji: "🥗" },
  { id: "merienda", label: "Merienda", emoji: "🍵" },
  { id: "cena", label: "Cena", emoji: "🍲" },
  { id: "antes_dormir", label: "Antes de dormir", emoji: "🌙" },
] as const;

export type MealId = (typeof MEALS)[number]["id"];


export function formatDateEs(d: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
