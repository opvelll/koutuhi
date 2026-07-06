import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

import type { SuicaRecord } from "../types";
import {
  addYearToDates,
  extractHistoryDate,
  parseSuicaHistoryText,
} from "./suicaParser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type TextChunk = {
  text: string;
  x: number;
  y: number;
};

export type PdfExtractionResult = {
  reportDate: string;
  lines: string[];
  records: SuicaRecord[];
  rawText: string;
};

export async function extractSuicaFromPdfFile(
  file: File,
): Promise<PdfExtractionResult> {
  const data = await file.arrayBuffer();
  const document = await pdfjsLib.getDocument({ data }).promise;
  const lines: string[] = [];
  const rawTextParts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const chunks: TextChunk[] = [];

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) {
        continue;
      }
      const textItem = item as TextItem;
      rawTextParts.push(textItem.str);
      const transform = pdfjsLib.Util.transform(
        viewport.transform,
        textItem.transform,
      );
      const x = transform[4];
      const y = transform[5];

      if (x < 150 || x > 540 || y < 90 || y > 680) {
        continue;
      }

      chunks.push({ text: textItem.str, x, y });
    }

    lines.push(...reconstructLines(chunks));
  }

  const rawText = rawTextParts.join("\n");
  const reportDate = extractHistoryDate(rawText);
  const records = addYearToDates(parseSuicaHistoryText(lines), reportDate);

  return { reportDate, lines, records, rawText };
}

export function reconstructLines(chunks: TextChunk[], tolerance = 2): string[] {
  const groups: TextChunk[][] = [];

  for (const chunk of chunks) {
    const group = groups.find((candidate) =>
      candidate.some((item) => Math.abs(item.y - chunk.y) <= tolerance),
    );

    if (group) {
      group.push(chunk);
    } else {
      groups.push([chunk]);
    }
  }

  return groups
    .sort((a, b) => averageY(a) - averageY(b))
    .map((group) =>
      group
        .sort((a, b) => a.x - b.x)
        .map((chunk) => chunk.text)
        .join(" ")
        .trim(),
    )
    .filter((line) => line && !line.includes("pw") && !line.includes("c"));
}

function averageY(chunks: TextChunk[]): number {
  return chunks.reduce((total, chunk) => total + chunk.y, 0) / chunks.length;
}

