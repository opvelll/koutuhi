import ExcelJS from "exceljs";

import type {
  CommuteEntry,
  EmployeeSettings,
  GeneratedWorkbook,
} from "../types";

const EXCEL_EPOCH_OFFSET = 25569;
const MILLISECONDS_PER_DAY = 86_400_000;
const PRINT_AREA = "A1:AL40";
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

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

    workbook.calcProperties.fullCalcOnLoad = true;
    writeReportDate(worksheet, year, month);
    writeStaticEntries(worksheet, settings);
    writeCommuteEntries(worksheet, group);
    refreshTemplateFormulas(worksheet, year, month);
    configurePrintLayout(worksheet);

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

function configurePrintLayout(worksheet: ExcelJS.Worksheet): void {
  worksheet.pageSetup.printArea = PRINT_AREA;
  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.orientation = "landscape";
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 1;
  delete worksheet.pageSetup.scale;
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

  for (const entry of entries.filter((item) => item.selected)) {
    const date = parseDateParts(entry.date);
    const key = `${date.year}-${String(date.month).padStart(2, "0")}`;
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
  target.value = toExcelSerial(year, month, 1);
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
    const date = parseDateParts(entry.date);
    const row = date.day + 6;
    if (entry.companyDataId) {
      writeTextIfPresent(worksheet.getCell(row, 3), entry.companyName);
      writeTextIfPresent(worksheet.getCell(row, 7), entry.workLocation);
      writeTimeIfPresent(worksheet, row, 13, entry.startTime);
      writeTimeIfPresent(worksheet, row, 17, entry.endTime);
    } else {
      clearCommuteDetails(worksheet, row);
    }
    writeIfEmpty(worksheet.getCell(row, 22), entry.route);
    writeIfEmpty(worksheet.getCell(row, 33), entry.roundTripFare);
  }
}

function clearCommuteDetails(worksheet: ExcelJS.Worksheet, row: number): void {
  for (const column of [3, 7, 13, 15, 17, 19]) {
    worksheet.getCell(row, column).value = null;
  }
}

function writeTimeIfPresent(
  worksheet: ExcelJS.Worksheet,
  row: number,
  hourColumn: number,
  value: string,
): void {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) {
    return;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) {
    return;
  }

  writeIfEmpty(worksheet.getCell(row, hourColumn), hour);
  writeIfEmpty(worksheet.getCell(row, hourColumn + 2), minute);
}

function writeTextIfPresent(cell: ExcelJS.Cell, value: string): void {
  const trimmed = value.trim();
  if (trimmed) {
    writeIfEmpty(cell, trimmed);
  }
}

function writeIfEmpty(cell: ExcelJS.Cell, value: string | number): void {
  if (cell.value === null || cell.value === undefined || cell.value === "") {
    cell.value = value;
  }
}

function refreshTemplateFormulas(
  worksheet: ExcelJS.Worksheet,
  year: number,
  month: number,
): void {
  refreshDateFormulas(worksheet, year, month);
  refreshSummaryFormulaResults(worksheet);
}

function refreshDateFormulas(
  worksheet: ExcelJS.Worksheet,
  year: number,
  month: number,
): void {
  const firstDaySerial = toExcelSerial(year, month, 1);

  for (let row = 7; row <= 37; row += 1) {
    const day = row - 6;
    const serial = firstDaySerial + day - 1;
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    worksheet.getCell(`A${row}`).value = {
      formula: row === 7 ? "D3" : `A${row - 1}+1`,
      result: serial,
    };
    worksheet.getCell(`B${row}`).value = {
      formula: `TEXT(A${row},"aaa")`,
      result: WEEKDAYS[weekday],
    };
  }
}

function refreshSummaryFormulaResults(worksheet: ExcelJS.Worksheet): void {
  const values = {
    S38: countNonEmpty(worksheet, "Q"),
    X38: sumColumn(worksheet, "AH"),
    AD38: countNonEmpty(worksheet, "AJ"),
    S39: sumColumn(worksheet, "T"),
    X39: sumColumn(worksheet, "AI"),
    AG39: sumColumn(worksheet, "AL"),
    S40: sumColumn(worksheet, "U"),
    AA40: sumColumn(worksheet, "AG"),
  };
  const derived = {
    ...values,
    AA38: values.X38 * 10,
    AG38: values.AD38 * 300,
    AA39: values.X39 * 5,
  };
  const totals = {
    ...derived,
    AI39: derived.AA38 + derived.AA39 + derived.AA40 + derived.AG38,
    AK39: derived.AG39 + readNumber(worksheet.getCell("AG40")),
  };

  writeFormulaResult(worksheet, "S38", "COUNTA(Q7:Q37)", totals.S38);
  writeFormulaResult(worksheet, "X38", "SUM($AH$7:$AH$37)", totals.X38);
  writeFormulaResult(worksheet, "AA38", "$X$38*10", totals.AA38);
  writeFormulaResult(worksheet, "AD38", "COUNTA($AJ$7:$AJ$37)", totals.AD38);
  writeFormulaResult(worksheet, "AG38", "AD38*300", totals.AG38);
  writeFormulaResult(worksheet, "S39", "SUM(T7:T37)", totals.S39);
  writeFormulaResult(worksheet, "X39", "SUM($AI$7:$AI$37)", totals.X39);
  writeFormulaResult(worksheet, "AA39", "$X$39*5", totals.AA39);
  writeFormulaResult(worksheet, "AG39", "SUM($AL$7:$AL$37)", totals.AG39);
  writeFormulaResult(worksheet, "AI39", "SUM(AA38,AA39,AA40,AG38)", totals.AI39);
  writeFormulaResult(worksheet, "AK39", "SUM(AG39,AG40)", totals.AK39);
  writeFormulaResult(worksheet, "S40", "SUM(U7:U37)", totals.S40);
  writeFormulaResult(worksheet, "AA40", "SUM($AG$7:$AG$37)", totals.AA40);
}

function writeFormulaResult(
  worksheet: ExcelJS.Worksheet,
  cellAddress: string,
  formula: string,
  result: number,
): void {
  worksheet.getCell(cellAddress).value = { formula, result };
}

function sumColumn(worksheet: ExcelJS.Worksheet, column: string): number {
  let sum = 0;

  for (let row = 7; row <= 37; row += 1) {
    sum += readNumber(worksheet.getCell(`${column}${row}`));
  }

  return sum;
}

function countNonEmpty(worksheet: ExcelJS.Worksheet, column: string): number {
  let count = 0;

  for (let row = 7; row <= 37; row += 1) {
    if (!isEmptyCellValue(worksheet.getCell(`${column}${row}`).value)) {
      count += 1;
    }
  }

  return count;
}

function readNumber(cell: ExcelJS.Cell): number {
  const value = cell.value;

  if (typeof value === "number") {
    return value;
  }
  if (isFormulaValue(value) && typeof value.result === "number") {
    return value.result;
  }

  return 0;
}

function isEmptyCellValue(value: ExcelJS.CellValue): boolean {
  if (value === null || value === undefined || value === "") {
    return true;
  }
  if (isFormulaValue(value)) {
    return value.result === null || value.result === undefined || value.result === "";
  }

  return false;
}

function isFormulaValue(value: ExcelJS.CellValue): value is ExcelJS.CellFormulaValue {
  return typeof value === "object" && value !== null && "formula" in value;
}

function parseDateParts(value: string): { year: number; month: number; day: number } {
  const [year, month, day] = value.split("/").map(Number);
  return { year, month, day };
}

function toExcelSerial(year: number, month: number, day: number): number {
  return Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY + EXCEL_EPOCH_OFFSET;
}
