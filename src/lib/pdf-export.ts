import jsPDF from "jspdf";
import { parseMeal } from "./meal-options";
import { DAYS, MEALS, type MealId } from "./domain";

export interface DietRow {
  day_of_week: number;
  meal: MealId;
  content: string;
}

// Paleta de marca (igual que la web)
const SAGE: [number, number, number] = [153, 184, 152]; // #99B898
const SAGE_DARK: [number, number, number] = [86, 110, 74];
const CORAL: [number, number, number] = [255, 132, 124]; // #FF847C
const ROJO: [number, number, number] = [232, 74, 95]; // #E84A5F
const INK: [number, number, number] = [42, 54, 59]; // #2A363B
const MUTED: [number, number, number] = [120, 122, 118];
const PAPER: [number, number, number] = [252, 250, 246];
const TINT: [number, number, number] = [238, 244, 237]; // fila alterna (salvia muy claro)

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

async function renderPdf(opts: { patientName: string; weekNumber: number; rows: DietRow[] }): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
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

  const drawBackground = () => {
    doc.setFillColor(...PAPER);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  };

  const drawBrand = () => {
    // Marca (izquierda)
    doc.setFillColor(...SAGE);
    doc.circle(MARGIN + 10, 34, 10, "F");
    doc.setFillColor(...PAPER);
    doc.circle(MARGIN + 10, 34, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...SAGE_DARK);
    doc.text("Lorena Ortega", MARGIN + 28, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("DIETÉTICA · NUTRICIÓN", MARGIN + 28, 43);

    // Paciente + semana (derecha)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("PACIENTE", PAGE_W - MARGIN, 26, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(opts.patientName, PAGE_W - MARGIN, 40, { align: "right" });

    // Barra de título
    const barY = 60;
    const barH = 26;
    doc.setFillColor(...SAGE);
    doc.roundedRect(MARGIN, barY, usableW, barH, 6, 6, "F");
    doc.setFont("helvetica", "bold");
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
    doc.setFont("helvetica", "bold");
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

  drawBackground();
  drawBrand();

  const meals = MEALS.filter((m) => DAYS.some((d) => mealGroups(rowContent(d.id, m.id)).length > 0));

  let y = drawHeaderRow(tableTop);

  meals.forEach((m, rowIdx) => {
    doc.setFont("helvetica", "normal");
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
    doc.setFont("helvetica", "bold");
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
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7);
          doc.setTextColor(...CORAL);
          doc.text("ó", x + dayW / 2, ty, { align: "center" });
          doc.setFont("helvetica", "normal");
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

  // Pie de página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
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
}): Promise<{ blob: Blob; filename: string }> {
  const doc = await renderPdf(opts);
  const filename = `dieta-${opts.patientName.replace(/\s+/g, "-").toLowerCase()}-semana-${opts.weekNumber}.pdf`;
  const blob = doc.output("blob");
  return { blob, filename };
}
