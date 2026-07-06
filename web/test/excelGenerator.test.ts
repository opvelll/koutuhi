import fs from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { generateTimesheets } from "../src/lib/excelGenerator";
import type { EmployeeSettings } from "../src/types";

const templateMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const excelEpochOffset = 25569;
const millisecondsPerDay = 86_400_000;
const defaultTemplateUrl = new URL(
  "../public/templates/default-timesheet.xlsx",
  import.meta.url,
);

describe("Excel generator", () => {
  it("keeps template formulas and refreshed cached results", async () => {
    const generated = await generateTimesheets(
      await loadDefaultTemplate(),
      [
        {
          date: "2023/10/24",
          route: "竹ノ塚～地　入谷",
          roundTripFare: 712,
        },
      ],
      defaultSettings(),
    );

    expect(generated).toHaveLength(1);
    expect(generated[0]?.fileName).toBe("勤務表_2023-10.xlsx");

    const generatedBuffer = await generated[0]!.blob.arrayBuffer();
    const sheetXml = readZipText(generatedBuffer, "xl/worksheets/sheet1.xml");
    expect(readZipText(generatedBuffer, "xl/workbook.xml")).toContain(
      'fullCalcOnLoad="1"',
    );
    expect(sheetXml).toMatch(/<c r="D3"[^>]*><v>45200<\/v><\/c>/);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(generatedBuffer);
    const worksheet = workbook.getWorksheet("勤務表");
    if (!worksheet) {
      throw new Error("勤務表シートが見つかりません。");
    }

    expect(serialOf(worksheet.getCell("D3").value)).toBe(45200);
    expect(formulaOf(worksheet.getCell("A30"))).toBe("A29+1");
    expect(serialOf(resultOf(worksheet.getCell("A30")))).toBe(45223);
    expect(formulaOf(worksheet.getCell("B30"))).toBe('TEXT(A30,"aaa")');
    expect(cellXmlValue(sheetXml, "B30")).toBe("火");
    expect(worksheet.getCell("V30").value).toBe("竹ノ塚～地　入谷");
    expect(worksheet.getCell("AG30").value).toBe(712);
    expect(formulaOf(worksheet.getCell("AA40"))).toBe("SUM($AG$7:$AG$37)");
    expect(resultOf(worksheet.getCell("AA40"))).toBe(712);
    expect(formulaOf(worksheet.getCell("AI39"))).toBe(
      "SUM(AA38,AA39,AA40,AG38)",
    );
    expect(resultOf(worksheet.getCell("AI39"))).toBe(712);

    for (let row = 7; row <= 37; row += 1) {
      expect(cellXmlValue(sheetXml, `B${row}`)).not.toBe("NaN");
    }
  });
});

async function loadDefaultTemplate(): Promise<File> {
  const bytes = new Uint8Array(await fs.readFile(defaultTemplateUrl));
  return new File([bytes], "default-timesheet.xlsx", {
    type: templateMimeType,
  });
}

function defaultSettings(): EmployeeSettings {
  return {
    branch: "東京",
    employeeId: "12345",
    name: "太郎 誠",
  };
}

function formulaOf(cell: ExcelJS.Cell): string | undefined {
  const value = cell.value;
  if (value && typeof value === "object" && "formula" in value) {
    return value.formula;
  }

  return undefined;
}

function resultOf(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value && typeof value === "object" && "result" in value) {
    return value.result;
  }

  return value;
}

function cellXmlValue(sheetXml: string, cellAddress: string): string | undefined {
  const match = sheetXml.match(
    new RegExp(`<c r="${cellAddress}"[^>]*>(?:<f[^>]*>[^<]*</f>)?<v>([^<]*)</v></c>`),
  );

  return match?.[1];
}

function serialOf(value: unknown): number | unknown {
  if (value instanceof Date) {
    return (
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()) /
        millisecondsPerDay +
      excelEpochOffset
    );
  }

  return value;
}

function readZipText(buffer: ArrayBuffer, entryName: string): string {
  const zip = Buffer.from(buffer);
  const endOfCentralDirectory = findSignature(zip, 0x06054b50, zip.length - 22);
  const centralDirectoryOffset = zip.readUInt32LE(endOfCentralDirectory + 16);
  const totalEntries = zip.readUInt16LE(endOfCentralDirectory + 10);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("ZIP central directory is invalid.");
    }

    const compressionMethod = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const fileNameLength = zip.readUInt16LE(offset + 28);
    const extraFieldLength = zip.readUInt16LE(offset + 30);
    const fileCommentLength = zip.readUInt16LE(offset + 32);
    const localHeaderOffset = zip.readUInt32LE(offset + 42);
    const fileName = zip.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    if (fileName === entryName) {
      const localFileNameLength = zip.readUInt16LE(localHeaderOffset + 26);
      const localExtraFieldLength = zip.readUInt16LE(localHeaderOffset + 28);
      const dataOffset =
        localHeaderOffset + 30 + localFileNameLength + localExtraFieldLength;
      const compressed = zip.subarray(dataOffset, dataOffset + compressedSize);

      if (compressionMethod === 0) {
        return compressed.toString("utf8");
      }
      if (compressionMethod === 8) {
        return inflateRawSync(compressed).toString("utf8");
      }
      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
    }

    offset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
  }

  throw new Error(`ZIP entry was not found: ${entryName}`);
}

function findSignature(zip: Buffer, signature: number, startOffset: number): number {
  for (let offset = startOffset; offset >= 0; offset -= 1) {
    if (zip.readUInt32LE(offset) === signature) {
      return offset;
    }
  }

  throw new Error("ZIP signature was not found.");
}
