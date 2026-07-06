import ExcelJS from "exceljs";

import type {
  CommuteEntry,
  EmployeeSettings,
  GeneratedWorkbook,
} from "../types";

export async function generateTimesheets(
  templateFile: File,
  entries: CommuteEntry[],
  settings: EmployeeSettings,
): Promise<GeneratedWorkbook[]> {
  const templateBuffer = await templateFile.arrayBuffer();
  const groups = groupByMonth(entries);
  const workbooks: GeneratedWorkbook[] = [];

  for (const [key, group] of groups) {
    const [yearRaw, monthRaw] = key.split("-");
    const year = Number(yearRaw);
    const month = Number(monthRaw);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(templateBuffer.slice(0));
    const worksheet = workbook.getWorksheet("勤務表") ?? workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("テンプレートにワークシートが見つかりません。");
    }

    writeReportDate(worksheet, year, month);
    writeStaticEntries(worksheet, settings);
    writeCommuteEntries(worksheet, group);

    const buffer = await workbook.xlsx.writeBuffer();
    workbooks.push({
      fileName: `勤務表_${year}-${String(month).padStart(2, "0")}.xlsx`,
      blob: new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
    });
  }

  return workbooks;
}

export function downloadWorkbook(workbook: GeneratedWorkbook): void {
  const url = URL.createObjectURL(workbook.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = workbook.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function groupByMonth(entries: CommuteEntry[]): Map<string, CommuteEntry[]> {
  const groups = new Map<string, CommuteEntry[]>();

  for (const entry of entries) {
    const date = parseDate(entry.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return new Map(Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function writeReportDate(
  worksheet: ExcelJS.Worksheet,
  year: number,
  month: number,
): void {
  const target = worksheet.getCell("D3");
  target.value = new Date(year, month - 1, 1);
  target.numFmt = "yyyy年m月";
}

function writeStaticEntries(
  worksheet: ExcelJS.Worksheet,
  settings: EmployeeSettings,
): void {
  writeIfEmpty(worksheet.getCell("J3"), settings.branch);
  writeIfEmpty(worksheet.getCell("Q3"), settings.employeeId);
  writeIfEmpty(worksheet.getCell("Z3"), settings.name);
}

function writeCommuteEntries(
  worksheet: ExcelJS.Worksheet,
  entries: CommuteEntry[],
): void {
  for (const entry of entries) {
    const date = parseDate(entry.date);
    const row = date.getDate() + 5;
    writeIfEmpty(worksheet.getCell(row, 22), entry.route);
    writeIfEmpty(worksheet.getCell(row, 33), entry.roundTripFare);
  }
}

function writeIfEmpty(cell: ExcelJS.Cell, value: string | number): void {
  if (cell.value === null || cell.value === undefined || cell.value === "") {
    cell.value = value;
  }
}

function parseDate(value: string): Date {
  const [year, month, day] = value.split("/").map(Number);
  return new Date(year, month - 1, day);
}

