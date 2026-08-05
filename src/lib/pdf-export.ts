import jsPDF from "jspdf";
import { parseMeal } from "./meal-options";
import { DAYS, MEALS, type MealId } from "./domain";

export interface DietRow {
  day_of_week: number;
  meal: MealId;
  content: string;
}

/** Totales nutricionales de un día (para el resumen del pie del PDF). */
export interface DayNutrition {
  day: number;
  kcal: number;
  prot: number;
  fat: number;
  carb: number;
  fiber: number;
}

// Paleta de marca (igual que la web)
const SAGE: [number, number, number] = [153, 184, 152]; // #99B898
const SAGE_DARK: [number, number, number] = [86, 110, 74];
const CORAL: [number, number, number] = [255, 132, 124]; // #FF847C
const NUDE: [number, number, number] = [254, 206, 168]; // #FECEA8
const ROJO: [number, number, number] = [232, 74, 95]; // #E84A5F
const INK: [number, number, number] = [42, 54, 59]; // #2A363B
const MUTED: [number, number, number] = [120, 122, 118];
const PAPER: [number, number, number] = [252, 250, 246];
const TINT: [number, number, number] = [238, 244, 237]; // fila alterna (salvia muy claro)

// Colores por macronutriente (mismos que la web)
const C_KCAL: [number, number, number] = [138, 111, 176];
const C_FAT: [number, number, number] = [224, 166, 75];
const C_CARB: [number, number, number] = [224, 126, 78];
const C_PROT: [number, number, number] = [94, 146, 201];
const C_FIBER: [number, number, number] = [95, 185, 142];

// Familia Poppins con dos pesos (400 normal, 500 medium). Máximo 500.
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

/** Texto compacto de una celda: nombres de alimentos por opción, alternativas
 *  separadas por una línea "ó". */
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
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

  // Fuente Poppins embebida (carga diferida para no inflar el bundle principal).
  const { POPPINS_REGULAR, POPPINS_MEDIUM } = await import("./fonts/poppins");
  doc.addFileToVFS("Poppins-Regular.ttf", POPPINS_REGULAR);
  doc.addFont("Poppins-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("Poppins-Medium.ttf", POPPINS_MEDIUM);
  doc.addFont("Poppins-Medium.ttf", FONT, "medium");

  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const MARGIN = 28;
  const usableW = PAGE_W - MARGIN * 2;
  const labelW = 78;
  const dayW = (usableW - labelW) / 7;
  const tableTop = 108;
  const bottom = PAGE_H - 30;
  const BODY = 7;
  const lineH = 8.3;
  const padX = 4;
  const padY = 6;

  const rowContent = (dayId: number, mealId: string) =>
    opts.rows.find((r) => r.day_of_week === dayId && r.meal === mealId)?.content ?? "";

  // Aurora difuminada: manchas de color de la paleta, muy translúcidas,
  // simuladas con círculos concéntricos (efecto glow), como en la landing.
  const drawAurora = () => {
    const g = doc as unknown as {
      GState?: new (o: { opacity: number }) => unknown;
      setGState?: (s: unknown) => void;
    };
    if (typeof g.GState !== "function" || typeof g.setGState !== "function") return;
    const blob = (cx: number, cy: number, R: number, rgb: [number, number, number]) => {
      doc.setFillColor(...rgb);
      const rings = 30;
      g.setGState!(new g.GState!({ opacity: 0.006 }));
      for (let k = rings; k >= 1; k--) doc.circle(cx, cy, (R * k) / rings, "F");
    };
    blob(70, 60, 250, SAGE);
    blob(PAGE_W - 55, 30, 230, CORAL);
    blob(120, PAGE_H - 30, 290, NUDE);
    blob(PAGE_W - 120, PAGE_H - 10, 300, ROJO);
    blob(PAGE_W / 2, PAGE_H + 40, 260, SAGE);
    g.setGState!(new g.GState!({ opacity: 1 })); // restaurar opacidad
  };

  const drawBackground = () => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    drawAurora();
  };

  const drawBrand = () => {
    // Marca (izquierda)
    doc.setFillColor(...SAGE);
    doc.circle(MARGIN + 10, 34, 10, "F");
    doc.setFillColor(...PAPER);
    doc.circle(MARGIN + 10, 34, 5, "F");
    doc.setFont(...MED);
    doc.setFontSize(15);
    doc.setTextColor(...SAGE_DARK);
    doc.text("Lorena Ortega", MARGIN + 28, 32);
    doc.setFont(...REG);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("DIETÉTICA · NUTRICIÓN", MARGIN + 28, 43);

    // Paciente + semana (derecha)
    doc.setFont(...REG);
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("PACIENTE", PAGE_W - MARGIN, 26, { align: "right" });
    doc.setFont(...MED);
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(opts.patientName, PAGE_W - MARGIN, 40, { align: "right" });

    // Barra de título
    const barY = 60;
    const barH = 26;
    doc.setFillColor(...SAGE);
    doc.roundedRect(MARGIN, barY, usableW, barH, 6, 6, "F");
    doc.setFont(...MED);
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("PLAN NUTRICIONAL SEMANAL", MARGIN + 14, barY + 17);
    // Pastilla de semana (coral) a la derecha de la barra
    const pillW = 96;
    const pillX = MARGIN + usableW - pillW - 8;
    doc.setFillColor(...ROJO);
    doc.roundedRect(pillX, barY + 5, pillW, barH - 10, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`SEMANA ${opts.weekNumber}`, pillX + pillW / 2, barY + 17, { align: "center" });
  };

  const drawHeaderRow = (y: number): number => {
    const h = 22;
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);
    doc.setFont(...MED);
    doc.setFontSize(8);
    // Esquina
    doc.setFillColor(...INK);
    doc.rect(MARGIN, y, labelW, h, "FD");
    doc.setTextColor(255, 255, 255);
    doc.text("COMIDA", MARGIN + labelW / 2, y + h / 2 + 2.6, { align: "center" });
    // Días
    DAYS.forEach((d, i) => {
      const x = MARGIN + labelW + i * dayW;
      doc.setFillColor(...INK);
      doc.rect(x, y, dayW, h, "FD");
      doc.setTextColor(255, 255, 255);
      doc.text(d.label.toUpperCase(), x + dayW / 2, y + h / 2 + 2.6, { align: "center" });
    });
    return y + h;
  };

  // --- Resumen nutricional por día, con el mismo formato que la web
  //     ("Análisis del día": donut de macros + barras de colores). ---

  // Segmento de anillo (annular) aproximado con triángulos, para el donut.
  const ringSeg = (
    cx: number,
    cy: number,
    rO: number,
    rI: number,
    a0: number,
    a1: number,
    color: [number, number, number],
  ) => {
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

  // Donut de macros (proporción de kcal: hidratos, grasa, proteína).
  const donut = (cx: number, cy: number, R: number, n: DayNutrition) => {
    const rI = R * 0.6;
    ringSeg(cx, cy, R, rI, 0, 360, [233, 231, 227]); // pista de fondo
    const pK = 4 * n.prot, cK = 4 * n.carb, fK = 9 * n.fat;
    const tot = pK + cK + fK;
    if (tot <= 0) return;
    const segs: [number, [number, number, number]][] = [
      [cK, C_CARB],
      [fK, C_FAT],
      [pK, C_PROT],
    ];
    let a = -90;
    for (const [v, c] of segs) {
      const sweep = (360 * v) / tot;
      if (sweep > 0.3) ringSeg(cx, cy, R, rI, a, a + sweep, c);
      a += sweep;
    }
  };

  // Mini-barras de macros (compactas, para la tira inferior de una página).
  const barsMini = (x: number, y: number, w: number, n: DayNutrition) => {
    const maxG = Math.max(1, n.fat, n.carb, n.prot, n.fiber);
    const rows: [string, number, [number, number, number]][] = [
      ["Grasa", n.fat, C_FAT],
      ["Hidratos", n.carb, C_CARB],
      ["Proteína", n.prot, C_PROT],
      ["Fibra", n.fiber, C_FIBER],
    ];
    const rh = 13;
    rows.forEach(([label, val, color], i) => {
      const yy = y + i * rh;
      doc.setFont(...REG);
      doc.setFontSize(6.2);
      doc.setTextColor(...MUTED);
      doc.text(label, x, yy + 5);
      doc.setFont(...MED);
      doc.setTextColor(...INK);
      doc.text(`${r1(val)} g`, x + w, yy + 5, { align: "right" });
      const by = yy + 6.8, bh = 3;
      doc.setFillColor(236, 236, 232);
      doc.roundedRect(x, by, w, bh, 1.5, 1.5, "F");
      const pct = Math.min(1, val / maxG);
      if (pct > 0) {
        doc.setFillColor(...color);
        doc.roundedRect(x, by, Math.max(2.5, w * pct), bh, 1.5, 1.5, "F");
      }
    });
  };

  // Tarjeta compacta "Análisis" de un día (día + kcal + donut + mini-barras),
  // pensada para 7 en una sola fila y que todo quepa en una página.
  const dayCardMini = (x: number, y: number, w: number, h: number, label: string, n: DayNutrition) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(228);
    doc.setLineWidth(0.7);
    doc.roundedRect(x, y, w, h, 6, 6, "FD");
    const cx = x + w / 2;
    // Día
    doc.setFont(...MED);
    doc.setFontSize(8);
    doc.setTextColor(...INK);
    doc.text(label, cx, y + 13, { align: "center" });
    // kcal
    doc.setFontSize(10);
    doc.setTextColor(...C_KCAL);
    doc.text(`${Math.round(n.kcal)}`, cx, y + 26, { align: "center" });
    doc.setFont(...REG);
    doc.setFontSize(6.2);
    doc.setTextColor(...MUTED);
    doc.text("kcal", cx, y + 33, { align: "center" });
    // Donut
    donut(cx, y + 56, 17, n);
    // Mini-barras
    barsMini(x + 8, y + 82, w - 16, n);
  };

  drawBackground();
  drawBrand();

  const meals = MEALS.filter((m) => DAYS.some((d) => mealGroups(rowContent(d.id, m.id)).length > 0));

  // Reservamos una tira inferior para el resumen nutricional (donuts + barras)
  // de modo que todo quepa en una sola página.
  const nutDays = (opts.dayNutrition ?? []).filter((n) => n.kcal > 0);
  const stripH = 140;
  const tableBottom = nutDays.length > 0 ? bottom - stripH - 24 : bottom;

  let y = drawHeaderRow(tableTop);

  meals.forEach((m, rowIdx) => {
    doc.setFont(...REG);
    doc.setFontSize(BODY);
    const cellLines = DAYS.map((d) => {
      const t = cellText(rowContent(d.id, m.id));
      return t ? (doc.splitTextToSize(t, dayW - padX * 2) as string[]) : [];
    });
    const maxLines = Math.max(1, ...cellLines.map((l) => l.length));
    const rowH = Math.max(26, maxLines * lineH + padY * 2);

    if (y + rowH > tableBottom) {
      doc.addPage();
      drawBackground();
      drawBrand();
      y = drawHeaderRow(tableTop);
    }

    doc.setDrawColor(220);
    doc.setLineWidth(0.5);

    // Celda de comida (izquierda)
    doc.setFillColor(...SAGE);
    doc.rect(MARGIN, y, labelW, rowH, "FD");
    doc.setFont(...MED);
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const ll = doc.splitTextToSize(m.label, labelW - 8) as string[];
    ll.forEach((ln, k) =>
      doc.text(ln, MARGIN + labelW / 2, y + rowH / 2 - (ll.length - 1) * 4 + k * 8 + 2, { align: "center" }),
    );

    // Celdas de días
    DAYS.forEach((d, i) => {
      const x = MARGIN + labelW + i * dayW;
      doc.setFillColor(...(rowIdx % 2 === 0 ? PAPER : TINT));
      doc.rect(x, y, dayW, rowH, "FD");
      let ty = y + padY + lineH * 0.7;
      for (const ln of cellLines[i]) {
        if (ln.trim() === "ó") {
          doc.setFont(...MED);
          doc.setFontSize(7);
          doc.setTextColor(...CORAL);
          doc.text("ó", x + dayW / 2, ty, { align: "center" });
          doc.setFont(...REG);
          doc.setTextColor(...INK);
        } else {
          doc.setFontSize(BODY);
          doc.setTextColor(...INK);
          doc.text(ln, x + padX, ty);
        }
        ty += lineH;
      }
    });

    y += rowH;
  });

  // Resumen nutricional: tira inferior con una mini-tarjeta "Análisis del día"
  // (donut + barras) por cada día con plan, todo en la misma página.
  if (nutDays.length > 0) {
    // Si por el motivo que sea no queda hueco (dieta muy larga), pasa a página nueva.
    let stripTop = y + 20;
    if (stripTop + stripH > bottom) {
      doc.addPage();
      drawBackground();
      drawBrand();
      stripTop = tableTop + 20;
    }

    doc.setFont(...MED);
    doc.setFontSize(9.5);
    doc.setTextColor(...SAGE_DARK);
    doc.text("RESUMEN NUTRICIONAL POR DÍA", MARGIN, stripTop - 7);

    const gap = 6;
    const cardW = (usableW - gap * 6) / 7;
    DAYS.forEach((d, i) => {
      const n = nutDays.find((nn) => nn.day === d.id);
      if (!n) return;
      const x = MARGIN + i * (cardW + gap);
      dayCardMini(x, stripTop, cardW, stripH, d.label, n);
    });
  }

  // Pie de página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont(...REG);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text("Lorena Ortega · Dietética & Nutrición", MARGIN, PAGE_H - 16);
    doc.text(`${i} / ${total}`, PAGE_W - MARGIN, PAGE_H - 16, { align: "right" });
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
