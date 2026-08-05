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

  // Resumen nutricional por día (energía + macros), alineado con las columnas
  // de la tabla. Devuelve la Y final.
  const drawNutrition = (startY: number): number => {
    const nutOf = (dayId: number) => opts.dayNutrition?.find((n) => n.day === dayId);
    const rowH = 15;

    // Título de sección
    doc.setFont(...MED);
    doc.setFontSize(9);
    doc.setTextColor(...SAGE_DARK);
    doc.text("RESUMEN NUTRICIONAL POR DÍA", MARGIN, startY - 6);

    let yy = startY;
    doc.setDrawColor(220);
    doc.setLineWidth(0.5);

    // Cabecera de días
    doc.setFillColor(...INK);
    doc.rect(MARGIN, yy, labelW, rowH, "FD");
    doc.setFont(...MED);
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text("NUTRIENTE", MARGIN + labelW / 2, yy + rowH / 2 + 2.4, { align: "center" });
    DAYS.forEach((d, i) => {
      const x = MARGIN + labelW + i * dayW;
      doc.setFillColor(...INK);
      doc.rect(x, yy, dayW, rowH, "FD");
      doc.setTextColor(255, 255, 255);
      doc.text(d.label.slice(0, 3).toUpperCase(), x + dayW / 2, yy + rowH / 2 + 2.4, { align: "center" });
    });
    yy += rowH;

    const metrics: { label: string; color: [number, number, number]; val: (n: DayNutrition) => string }[] = [
      { label: "Energía (kcal)", color: C_KCAL, val: (n) => Math.round(n.kcal).toString() },
      { label: "Grasas (g)", color: C_FAT, val: (n) => r1(n.fat) },
      { label: "H. de carbono (g)", color: C_CARB, val: (n) => r1(n.carb) },
      { label: "Proteínas (g)", color: C_PROT, val: (n) => r1(n.prot) },
      { label: "Fibra (g)", color: C_FIBER, val: (n) => r1(n.fiber) },
    ];

    metrics.forEach((mt, ri) => {
      // Etiqueta de la métrica (con su color de macro)
      doc.setFillColor(...TINT);
      doc.rect(MARGIN, yy, labelW, rowH, "FD");
      doc.setFont(...MED);
      doc.setFontSize(6.8);
      doc.setTextColor(...mt.color);
      doc.text(mt.label, MARGIN + 5, yy + rowH / 2 + 2.2);
      // Valores por día
      DAYS.forEach((d, i) => {
        const x = MARGIN + labelW + i * dayW;
        doc.setFillColor(...(ri % 2 === 0 ? PAPER : TINT));
        doc.rect(x, yy, dayW, rowH, "FD");
        const n = nutOf(d.id);
        doc.setFont(...REG);
        doc.setFontSize(7.5);
        doc.setTextColor(...INK);
        doc.text(n ? mt.val(n) : "—", x + dayW / 2, yy + rowH / 2 + 2.6, { align: "center" });
      });
      yy += rowH;
    });
    return yy;
  };

  drawBackground();
  drawBrand();

  const meals = MEALS.filter((m) => DAYS.some((d) => mealGroups(rowContent(d.id, m.id)).length > 0));

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

    if (y + rowH > bottom) {
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

  // Resumen nutricional al final del PDF (si hay datos).
  if (opts.dayNutrition && opts.dayNutrition.some((n) => n.kcal > 0)) {
    const blockH = 15 * 6; // cabecera + 5 métricas
    if (y + 26 + blockH > bottom) {
      doc.addPage();
      drawBackground();
      drawBrand();
      y = tableTop;
    } else {
      y += 26;
    }
    drawNutrition(y);
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
