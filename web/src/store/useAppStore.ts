import { create } from "zustand";

import type {
  EmployeeSettings,
  ExtractStatus,
  GeneratedWorkbook,
  SuicaRecord,
} from "../types";
import { downloadWorkbook, generateTimesheets } from "../lib/excelGenerator";
import { extractSuicaWithOcr, type OcrProgress } from "../lib/ocrFallback";
import { extractSuicaFromPdfFile } from "../lib/pdfTextExtractor";
import { transformCommute } from "../lib/suicaTransform";

type AppState = {
  status: ExtractStatus;
  message: string;
  pdfFile: File | null;
  templateFile: File | null;
  reportDate: string;
  records: SuicaRecord[];
  generated: GeneratedWorkbook[];
  settings: EmployeeSettings;
  ocrProgress: OcrProgress | null;
  setTemplateFile: (file: File | null) => void;
  setSetting: (key: keyof EmployeeSettings, value: string) => void;
  loadPdf: (file: File) => Promise<void>;
  runOcr: () => Promise<void>;
  toggleRecord: (id: string) => void;
  setAllEligible: (selected: boolean) => void;
  generate: () => Promise<void>;
};

const defaultSettings: EmployeeSettings = {
  branch: "東京",
  employeeId: "12345",
  name: "太郎 誠",
};

export const useAppStore = create<AppState>((set, get) => ({
  status: "idle",
  message: "",
  pdfFile: null,
  templateFile: null,
  reportDate: "",
  records: [],
  generated: [],
  settings: defaultSettings,
  ocrProgress: null,

  setTemplateFile: (file) => set({ templateFile: file, generated: [] }),

  setSetting: (key, value) =>
    set((state) => ({ settings: { ...state.settings, [key]: value } })),

  loadPdf: async (file) => {
    set({
      status: "extracting",
      message: "PDFを解析中",
      pdfFile: file,
      records: [],
      generated: [],
      reportDate: "",
      ocrProgress: null,
    });

    try {
      const result = await extractSuicaFromPdfFile(file);
      if (result.records.length === 0) {
        set({
          status: "ocr-ready",
          message: "テキスト抽出では履歴が見つかりませんでした。",
          reportDate: result.reportDate,
          records: [],
        });
        return;
      }

      set({
        status: "ready",
        message: `${result.records.length}件の履歴を抽出しました。`,
        reportDate: result.reportDate,
        records: result.records,
      });
    } catch (error) {
      set({
        status: "error",
        message: error instanceof Error ? error.message : "PDF解析に失敗しました。",
      });
    }
  },

  runOcr: async () => {
    const { pdfFile } = get();
    if (!pdfFile) {
      return;
    }

    set({
      status: "ocr-running",
      message: "OCRを実行中",
      ocrProgress: null,
      records: [],
      generated: [],
    });

    try {
      const result = await extractSuicaWithOcr(pdfFile, (progress) =>
        set({ ocrProgress: progress }),
      );
      set({
        status: result.records.length > 0 ? "ready" : "error",
        message:
          result.records.length > 0
            ? `${result.records.length}件の履歴をOCRで抽出しました。`
            : "OCR結果から履歴を抽出できませんでした。",
        reportDate: result.reportDate,
        records: result.records,
      });
    } catch (error) {
      set({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "OCRフォールバックに失敗しました。",
      });
    }
  },

  toggleRecord: (id) =>
    set((state) => ({
      records: state.records.map((record) =>
        record.id === id && record.selectable
          ? { ...record, selected: !record.selected }
          : record,
      ),
      generated: [],
    })),

  setAllEligible: (selected) =>
    set((state) => ({
      records: state.records.map((record) =>
        record.selectable ? { ...record, selected } : record,
      ),
      generated: [],
    })),

  generate: async () => {
    const { records, templateFile, settings } = get();
    if (!templateFile) {
      set({ status: "error", message: "テンプレートExcelを選択してください。" });
      return;
    }

    const selectedRecords = records.filter((record) => record.selected);
    if (selectedRecords.length === 0) {
      set({ status: "error", message: "生成対象の履歴がありません。" });
      return;
    }

    set({ status: "generating", message: "Excelを生成中", generated: [] });

    try {
      const commuteEntries = transformCommute(selectedRecords);
      const generated = await generateTimesheets(
        templateFile,
        commuteEntries,
        settings,
      );
      generated.forEach(downloadWorkbook);
      set({
        status: "ready",
        message: `${generated.length}件のExcelを生成しました。`,
        generated,
      });
    } catch (error) {
      set({
        status: "error",
        message:
          error instanceof Error ? error.message : "Excel生成に失敗しました。",
      });
    }
  },
}));

