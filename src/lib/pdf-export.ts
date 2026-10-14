import jsPDF from "jspdf";
import { parseMeal } from "./meal-options";
import { DAYS, MEALS, type MealId } from "./domain";

export interface DietRow {
  day_of_week: number;
  meal: MealId;
  content: string;
}

/** Totales nutricionales de un día (para el análisis de cada folio). */
export interface DayNutrition {
  day: number;
  kcal: number;
  prot: number;
  fat: number;
  carb: number;
  fiber: number;
}

// Paleta de marca (igual que la web)
const SAGE: [number, number, number] = [153, 184, 152];
const SAGE_DARK: [number, number, number] = [86, 110, 74];
const CORAL: [number, number, number] = [255, 132, 124];
const NUDE: [number, number, number] = [254, 206, 168];
const ROJO: [number, number, number] = [232, 74, 95];
const INK: [number, number, number] = [42, 54, 59];
const MUTED: [number, number, number] = [120, 122, 118];
const PAPER: [number, number, number] = [252, 250, 246];

// Colores por macronutriente (mismos que la web)
const C_KCAL: [number, number, number] = [138, 111, 176];
const C_FAT: [number, number, number] = [224, 166, 75];
const C_CARB: [number, number, number] = [224, 126, 78];
const C_PROT: [number, number, number] = [94, 146, 201];
const C_FIBER: [number, number, number] = [95, 185, 142];

const FONT = "Poppins";
const REG: [string, string] = [FONT, "normal"];
const MED: [string, string] = [FONT, "medium"];

const r1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Agrupa el contenido de una comida en opciones (una "O" abre opción nueva,
 *  una "Y" añade otro alimento a la misma opción). */
function mealGroups(content: string): string[][] {
  const { options, joiners } = parseMeal(content ?? "");
  const groups: string[][] = [[]];
  options.forEach((opt, i) => {
    if (i > 0 && joiners[i - 1] === "o") groups.push([]);
    const c = (opt.content ?? "").trim();
    if (c) groups[groups.length - 1].push(c);
  });
  return groups.filter((g) => g.length > 0);
}

/** Texto de una comida: alimentos por opción, alternativas separadas por "ó". */
function cellText(content: string): string {
  const groups = mealGroups(content);
  if (!groups.length) return "";
  const parts = groups.map((g) => g.map((b) => b.split("\n")[0].trim()).filter(Boolean).join(", "));
  return parts.join("\nó\n");
}

async function renderPdf(opts: {
  patientName: string;
  weekNumber: number;
  rows: DietRow[];
  dayNutrition?: DayNutrition[];
}): Promise<jsPDF> {
  // Vertical (A4 folio): un día por página.
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });

  const { POPPINS_REGULAR, POPPINS_MEDIUM } = await import("./fonts/poppins");
  doc.addFileToVFS("Poppins-Regular.ttf", POPPINS_REGULAR);
  doc.addFont("Poppins-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Poppins-Medium.ttf", POPPINS_MEDIUM);
  doc.addFont("Poppins-Medium.ttf", FONT, "medium");
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 40;
  const usableW = PAGE_W - MARGIN * 2;

  const rowContent = (dayId: number, mealId: string) =>
    opts.rows.find((r) => r.day_of_week === dayId && r.meal === mealId)?.content ?? "";

  // Aurora difuminada (manchas de color translúcidas), como la web.
  const drawAurora = () => {
    const g = doc as unknown as {
      GState?: new (o: { opacity: number }) => unknown;
      setGState?: (s: unknown) => void;
    };
    if (typeof g.GState !== "function" || typeof g.setGState !== "function") return;
    const blob = (cx: number, cy: number, R: number, rgb: [number, number, number]) => {
      doc.setFillColor(...rgb);
      const rings = 28;
      g.setGState!(new g.GState!({ opacity: 0.006 }));
      for (let k = rings; k >= 1; k--) doc.circle(cx, cy, (R * k) / rings, "F");
    };
    blob(60, 50, 230, SAGE);
    blob(PAGE_W - 40, 80, 220, NUDE);
    blob(PAGE_W - 60, PAGE_H - 40, 260, ROJO);
    blob(70, PAGE_H - 60, 240, CORAL);
    g.setGState!(new g.GState!({ opacity: 1 }));
  };

  const drawBackground = () => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    drawAurora();
  };

  // Segmento de anillo (para el donut).
  const ringSeg = (cx: number, cy: number, rO: number, rI: number, a0: number, a1: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    const steps = Math.max(2, Math.ceil((a1 - a0) / 6));
    for (let s = 0; s < steps; s++) {
      const t0 = ((a0 + ((a1 - a0) * s) / steps) * Math.PI) / 180;
      const t1 = ((a0 + ((a1 - a0) * (s + 1)) / steps) * Math.PI) / 180;
      const p1x = cx + rO * Math.cos(t0), p1y = cy + rO * Math.sin(t0);
      const p2x = cx + rO * Math.cos(t1), p2y = cy + rO * Math.sin(t1);
      const p3x = cx + rI * Math.cos(t1), p3y = cy + rI * Math.sin(t1);
      const p4x = cx + rI * Math.cos(t0), p4y = cy + rI * Math.sin(t0);
      doc.triangle(p1x, p1y, p2x, p2y, p3x, p3y, "F");
      doc.triangle(p1x, p1y, p3x, p3y, p4x, p4y, "F");
    }
  };

  const donut = (cx: number, cy: number, R: number, n: DayNutrition) => {
    const rI = R * 0.6;
    ringSeg(cx, cy, R, rI, 0, 360, [233, 231, 227]);
    const pK = 4 * n.prot, cK = 4 * n.carb, fK = 9 * n.fat;
    const tot = pK + cK + fK;
    if (tot <= 0) return;
    const segs: [number, [number, number, number]][] = [[cK, C_CARB], [fK, C_FAT], [pK, C_PROT]];
    let a = -90;
    for (const [v, c] of segs) {
      const sweep = (360 * v) / tot;
      if (sweep > 0.3) ringSeg(cx, cy, R, rI, a, a + sweep, c);
      a += sweep;
    }
  };

  const barsMini = (x: number, y: number, w: number, n: DayNutrition) => {
    const maxG = Math.max(1, n.fat, n.carb, n.prot, n.fiber);
    const rows: [string, number, [number, number, number]][] = [
      ["Grasa", n.fat, C_FAT],
      ["Hidratos", n.carb, C_CARB],
      ["Proteína", n.prot, C_PROT],
      ["Fibra", n.fiber, C_FIBER],
    ];
    const rh = 15;
    rows.forEach(([label, val, color], i) => {
      const yy = y + i * rh;
      doc.setFont(...REG);
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(label, x, yy + 6);
      doc.setFont(...MED);
      doc.setTextColor(...INK);
      doc.text(`${r1(val)} g`, x + w, yy + 6, { align: "right" });
      const by = yy + 8, bh = 3.5;
      doc.setFillColor(236, 236, 232);
      doc.roundedRect(x, by, w, bh, 1.5, 1.5, "F");
      const pct = Math.min(1, val / maxG);
      if (pct > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(x, by, Math.max(2.5, w * pct), bh, 1.5, 1.5, "F");
      }
    });
  };

  // Cabecera de un folio: marca + paciente/semana + barra con el día.
  const drawHeader = (dayLabel: string, kcal?: number): number => {
    doc.setFillColor(...SAGE);
    doc.circle(MARGIN + 10, 40, 10, "F");
    doc.setFillColor(...PAPER);
    doc.circle(MARGIN + 10, 40, 5, "F");
    doc.setFont(...MED);
    doc.setFontSize(15);
    doc.setTextColor(...SAGE_DARK);
    doc.text("Lorena Ortega", MARGIN + 28, 38);
    doc.setFont(...REG);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("DIETÉTICA · NUTRICIÓN", MARGIN + 28, 49);

    doc.setFont(...REG);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`PACIENTE · SEMANA ${opts.weekNumber}`, PAGE_W - MARGIN, 32, { align: "right" });
    doc.setFont(...MED);
    doc.setFontSize(11);
    doc.setTextColor(...INK);
    doc.text(opts.patientName, PAGE_W - MARGIN, 46, { align: "right" });

    const barY = 66, barH = 32;
    doc.setFillColor(...SAGE);
    doc.roundedRect(MARGIN, barY, usableW, barH, 7, 7, "F");
    doc.setFont(...MED);
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(dayLabel.toUpperCase(), MARGIN + 16, barY + 21);
    if (kcal && kcal > 0) {
      const pillW = 104, pillX = MARGIN + usableW - pillW - 8;
      doc.setFillColor(...ROJO);
      doc.roundedRect(pillX, barY + 6, pillW, barH - 12, 5, 5, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${Math.round(kcal)} kcal`, pillX + pillW / 2, barY + 20, { align: "center" });
    }
    return barY + barH + 18;
  };

  // Tarjeta de una comida del día.
  const drawMealCard = (label: string, content: string, y: number): number => {
    const text = cellText(content);
    doc.setFont(...REG);
    doc.setFontSize(10.5);
    const lines = (text ? doc.splitTextToSize(text, usableW - 28) : ["—"]) as string[];
    const cardH = 32 + lines.length * 14 + 6;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228);
    doc.setLineWidth(0.7);
    doc.roundedRect(MARGIN, y, usableW, cardH, 9, 9, "FD");
    doc.setFont(...MED);
    doc.setFontSize(10.5);
    doc.setTextColor(...SAGE_DARK);
    doc.text(label.toUpperCase(), MARGIN + 16, y + 19);
    doc.setDrawColor(235);
    doc.setLineWidth(0.5);
    doc.line(MARGIN + 16, y + 25, MARGIN + usableW - 16, y + 25);
    let ty = y + 38;
    for (const ln of lines) {
      if (ln.trim() === "ó") {
        doc.setFont(...MED);
        doc.setFontSize(9);
        doc.setTextColor(...CORAL);
        doc.text("ó", MARGIN + usableW / 2, ty, { align: "center" });
      } else {
        doc.setFont(...REG);
        doc.setFontSize(10.5);
        doc.setTextColor(...INK);
        doc.text(ln, MARGIN + 16, ty);
      }
      ty += 14;
    }
    return y + cardH + 9;
  };

  // Análisis del día (donut + kcal + barras), mismo formato que la web.
  const drawDayAnalysis = (n: DayNutrition, y: number): number => {
    const h = 108;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228);
    doc.setLineWidth(0.7);
    doc.roundedRect(MARGIN, y, usableW, h, 9, 9, "FD");
    doc.setFont(...MED);
    doc.setFontSize(9);
    doc.setTextColor(...SAGE_DARK);
    doc.text("ANÁLISIS DEL DÍA", MARGIN + 16, y + 18);
    const dcx = MARGIN + 64, dcy = y + 66;
    donut(dcx, dcy, 32, n);
    doc.setFont(...MED);
    doc.setFontSize(13);
    doc.setTextColor(...C_KCAL);
    doc.text(`${Math.round(n.kcal)}`, dcx, dcy + 2, { align: "center" });
    doc.setFont(...REG);
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text("kcal", dcx, dcy + 11, { align: "center" });
    barsMini(MARGIN + 150, y + 30, usableW - 150 - 26, n);
    return y + h + 9;
  };

  // Pie de página con el ESTILO de la firma: curvas de color pastel en las
  // esquinas + datos de contacto centrados (sin incrustar la imagen).
  const drawFooter = () => {
    const g = doc as unknown as {
      GState?: new (o: { opacity: number }) => unknown;
      setGState?: (s: unknown) => void;
    };
    const hasG = typeof g.GState === "function" && typeof g.setGState === "function";
    const soft = (op: number) => {
      if (hasG) g.setGState!(new g.GState!({ opacity: op }));
    };

    const footTop = PAGE_H - 84;

    const blob = (cx: number, cy: number, rx: number, ry: number, rgb: [number, number, number], op: number) => {
      soft(op);
      doc.setFillColor(...rgb);
      doc.ellipse(cx, cy, rx, ry, "F");
    };
    // Esquina izquierda
    blob(36, PAGE_H - 16, 80, 44, SAGE, 0.5);
    blob(100, PAGE_H + 16, 62, 38, NUDE, 0.45);
    blob(12, PAGE_H - 46, 42, 28, CORAL, 0.26);
    // Esquina derecha
    blob(PAGE_W - 38, PAGE_H - 20, 84, 46, NUDE, 0.5);
    blob(PAGE_W - 100, PAGE_H + 14, 62, 38, CORAL, 0.42);
    blob(PAGE_W - 14, PAGE_H - 48, 42, 28, SAGE, 0.3);
    soft(1);

    doc.setDrawColor(210, 205, 196);
    doc.setLineWidth(0.6);
    doc.line(MARGIN + 70, footTop, PAGE_W - MARGIN - 70, footTop);

    doc.setFont(...MED);
    doc.setFontSize(8.5);
    doc.setTextColor(...SAGE_DARK);
    doc.setCharSpace(1.1);
    doc.text("LORENA ORTEGA  ·  NUTRICIÓN · SALUD · BIENESTAR", PAGE_W / 2, footTop + 20, { align: "center" });
    doc.setCharSpace(0);

    doc.setFont(...REG);
    doc.setFontSize(8.5);
    doc.setTextColor(...INK);
    doc.text(
      "658 894 356   ·   lorena@lorenaortega.es   ·   @lorenaortega   ·   Málaga y online",
      PAGE_W / 2,
      footTop + 36,
      { align: "center" }
    );
  };

  const daysWithContent = DAYS.filter((d) => MEALS.some((m) => mealGroups(rowContent(d.id, m.id)).length > 0));
  const pages = daysWithContent.length ? daysWithContent : [DAYS[0]];

  pages.forEach((d, idx) => {
    if (idx > 0) doc.addPage();
    drawBackground();
    const n = (opts.dayNutrition ?? []).find((nn) => nn.day === d.id);
    let y = drawHeader(d.label, n?.kcal);

    const dayMeals = MEALS.filter((m) => mealGroups(rowContent(d.id, m.id)).length > 0);
    if (!dayMeals.length) {
      doc.setFont(...REG);
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text("Sin comidas asignadas este día.", MARGIN + 16, y + 12);
      y += 34;
    } else {
      dayMeals.forEach((m) => {
        y = drawMealCard(m.label, rowContent(d.id, m.id), y);
      });
    }

    if (n && n.kcal > 0) y = drawDayAnalysis(n, y + 2);

    drawFooter();
  });

  // Numeración de páginas
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont(...REG);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(`${i} / ${total}`, PAGE_W / 2, PAGE_H - 12, { align: "center" });
  }

  return doc;
}

export async function buildDietPdf(opts: {
  patientName: string;
  weekNumber: number;
  rows: DietRow[];
  dayNutrition?: DayNutrition[];
}): Promise<{ blob: Blob; filename: string }> {
  const doc = await renderPdf(opts);
  const filename = `dieta-${opts.patientName.replace(/\s+/g, "-").toLowerCase()}-semana-${opts.weekNumber}.pdf`;
  const blob = doc.output("blob");
  doc.save(filename);
  return { blob, filename };
}

export async function buildDietPdfBlob(opts: {
  patientName: string;
  weekNumber: number;
  rows: DietRow[];
  dayNutrition?: DayNutrition[];
}): Promise<{ blob: Blob; filename: string }> {
  const doc = await renderPdf(opts);
  const filename = `dieta-${opts.patientName.replace(/\s+/g, "-").toLowerCase()}-semana-${opts.weekNumber}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}

/** Bytes del PDF (para generar en el servidor y subir con service_role). */
export async function buildDietPdfBytes(opts: {
  patientName: string;
  weekNumber: number;
  rows: DietRow[];
  dayNutrition?: DayNutrition[];
}): Promise<Uint8Array> {
  const doc = await renderPdf(opts);
  return new Uint8Array(doc.output("arraybuffer"));
}
