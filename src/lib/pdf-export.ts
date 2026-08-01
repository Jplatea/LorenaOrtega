import { renderMeal } from "./meal-options";
import jsPDF from "jspdf";
import { DAYS, MEALS, type MealId } from "./domain";
import watermarkUrl from "@/assets/diet-watermark.jpg";

export interface DietRow {
  day_of_week: number;
  meal: MealId;
  content: string;
}

// Sage brand color (matches primary in styles.css)
const SAGE: [number, number, number] = [138, 158, 120];
const SAGE_DARK: [number, number, number] = [86, 110, 74];
const ACCENT: [number, number, number] = [196, 122, 110]; // dusty coral for week info
const INK: [number, number, number] = [55, 55, 50];
const MUTED: [number, number, number] = [120, 120, 115];

// A4 in pt
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 70;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

async function loadImageDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function drawBackground(doc: jsPDF, watermark: string) {
  // Cream paper base
  doc.setFillColor(252, 249, 243);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  // Watermark border (natural opacity — the image is already faded)
  const anyDoc = doc as any;
  if (typeof anyDoc.setGState === "function" && typeof anyDoc.GState === "function") {
    const gs = new anyDoc.GState({ opacity: 0.35 });
    anyDoc.setGState(gs);
    doc.addImage(watermark, "JPEG", 0, 0, PAGE_W, PAGE_H);
    const gsFull = new anyDoc.GState({ opacity: 1 });
    anyDoc.setGState(gsFull);
  } else {
    doc.addImage(watermark, "JPEG", 0, 0, PAGE_W, PAGE_H);
  }
}

function drawHeader(doc: jsPDF, patientName: string, weekNumber: number) {
  // Logo top-left
  const logoX = MARGIN_X;
  const logoY = 78;

  // Small sage circle mark
  doc.setFillColor(...SAGE);
  doc.circle(logoX + 10, logoY - 4, 10, "F");
  doc.setFillColor(252, 249, 243);
  doc.circle(logoX + 10, logoY - 4, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...SAGE_DARK);
  doc.text("Lorena Ortega", logoX + 28, logoY - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text("DIETÉTICA · NUTRICIÓN", logoX + 28, logoY + 7);

  // Week info block — right-aligned, differentiated color
  const boxW = 150;
  const boxH = 44;
  const boxX = PAGE_W - MARGIN_X - boxW;
  const boxY = logoY - 22;
  doc.setFillColor(...ACCENT);
  doc.roundedRect(boxX, boxY, boxW, boxH, 6, 6, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 245, 240);
  doc.text("PLAN NUTRICIONAL", boxX + boxW / 2, boxY + 13, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(`Semana ${weekNumber}`, boxX + boxW / 2, boxY + 30, { align: "center" });

  // Patient name — centered under header
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("PACIENTE", MARGIN_X, logoY + 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...INK);
  doc.text(patientName, MARGIN_X, logoY + 50);

  // Thin sage divider
  doc.setDrawColor(...SAGE);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_X, logoY + 62, PAGE_W - MARGIN_X, logoY + 62);
}

function drawFooter(doc: jsPDF, page: number, total: number) {
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("Lorena Ortega · Dietética & Nutrición", MARGIN_X, PAGE_H - 32);
  doc.text(`${page} / ${total}`, PAGE_W - MARGIN_X, PAGE_H - 32, { align: "right" });
}

async function renderPdf(opts: {
  patientName: string;
  weekNumber: number;
  rows: DietRow[];
}): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const watermark = await loadImageDataUrl(watermarkUrl);

  drawBackground(doc, watermark);
  drawHeader(doc, opts.patientName, opts.weekNumber);

  let y = 200;

  for (const day of DAYS) {
    const dayRows = MEALS
      .map((meal) => ({
        meal,
        row: opts.rows.find((r) => r.day_of_week === day.id && r.meal === meal.id),
      }))
      .filter((x) => x.row?.content?.trim());

    if (dayRows.length === 0) continue;

    // Estimate needed height for the day block
    let estimate = 40;
    for (const { row } of dayRows) {
      const lines = doc.splitTextToSize(renderMeal(row!.content), CONTENT_W - 30);
      estimate += 22 + lines.length * 12 + 10;
    }

    if (y + estimate > PAGE_H - 70) {
      doc.addPage();
      drawBackground(doc, watermark);
      y = 90;
    }

    // Day heading pill
    doc.setFillColor(...SAGE);
    doc.roundedRect(MARGIN_X, y, 110, 22, 4, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(day.label.toUpperCase(), MARGIN_X + 55, y + 15, { align: "center" });
    y += 34;

    for (const { meal, row } of dayRows) {
      const lines = doc.splitTextToSize(renderMeal(row!.content), CONTENT_W - 30);
      const blockH = 20 + lines.length * 12 + 8;

      if (y + blockH > PAGE_H - 70) {
        doc.addPage();
        drawBackground(doc, watermark);
        y = 90;
      }

      // Meal label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...SAGE_DARK);
      doc.text(`${meal.label}`, MARGIN_X + 4, y);
      y += 14;

      // Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...INK);
      for (const line of lines) {
        if (y > PAGE_H - 70) {
          doc.addPage();
          drawBackground(doc, watermark);
          y = 90;
        }
        doc.text(line, MARGIN_X + 14, y);
        y += 13;
      }
      y += 10;
    }
    y += 12;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(doc, i, total);
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
