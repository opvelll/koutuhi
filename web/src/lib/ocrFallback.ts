import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import tesseractCoreUrl from "tesseract.js-core/tesseract-core.wasm.js?url";
import tesseractWorkerUrl from "tesseract.js/dist/worker.min.js?url";

import type { SuicaRecord } from "../types";
import {
  addYearToDates,
  extractHistoryDate,
  parseSuicaHistoryText,
} from "./suicaParser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export type OcrProgress = {
  status: string;
  progress: number;
};

export type OcrExtractionResult = {
  reportDate: string;
  text: string;
  records: SuicaRecord[];
};

export async function extractSuicaWithOcr(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
): Promise<OcrExtractionResult> {
  const [{ createWorker }, canvases] = await Promise.all([
    import("tesseract.js"),
    renderPdfPages(file),
  ]);

  const worker = await createWorker("jpn", 1, {
    workerPath: tesseractWorkerUrl,
    corePath: tesseractCoreUrl,
    langPath: "/tessdata",
    logger: (message: OcrProgress) => onProgress?.(message),
  });

  try {
    const texts: string[] = [];
    for (const canvas of canvases) {
      const result = await worker.recognize(canvas);
      texts.push(result.data.text);
    }

    const text = texts.join("\n");
    const reportDate = extractHistoryDate(text);
    const lines = text.split(/\r?\n/).map((line) => line.trim());
    const records = addYearToDates(parseSuicaHistoryText(lines), reportDate);

    return { reportDate, text, records };
  } finally {
    await worker.terminate();
  }
}

async function renderPdfPages(file: File): Promise<HTMLCanvasElement[]> {
  const data = await file.arrayBuffer();
  const document = await pdfjsLib.getDocument({ data }).promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = documentCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas contextを作成できませんでした。");
    }

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    canvases.push(canvas);
  }

  return canvases;
}

function documentCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
