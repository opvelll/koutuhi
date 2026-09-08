import { create } from "zustand";

import type {
  CompanyData,
  CompanyDataInput,
  CommuteEntry,
  EmployeeSettings,
  ExtractStatus,
  GeneratedWorkbook,
} from "../types";
import {
  loadCompanyData,
  removeCompanyData,
  saveCompanyData,
  upsertCompanyData,
} from "../lib/companyData";
import { downloadWorkbook, generateTimesheets } from "../lib/excelGenerator";
import {
  clearEditingDraft,
  loadEditingDraft,
  saveEditingDraft,
} from "../lib/editingDraft";
import {
  loadEmployeeSettings,
  saveEmployeeSettings,
} from "../lib/employeeSettings";
import {
  applyCompanyData,
  applyFirstMatchingCompanyData,
} from "../lib/commuteRoutes";
import { extractSuicaFromPdfFile } from "../lib/pdfTextExtractor";
import { normalizeRouteKey, transformCommute } from "../lib/suicaTransform";

type TemplateSource = "default" | "custom";

type AppState = {
  status: ExtractStatus;
  message: string;
  pdfFileName: string;
  templateFile: File | null;
  templateSource: TemplateSource | null;
  defaultTemplateLoading: boolean;
  reportDate: string;
  commuteEntries: CommuteEntry[];
  generated: GeneratedWorkbook[];
  settings: EmployeeSettings;
  companyData: CompanyData[];
  initializeDefaultTemplate: () => Promise<void>;
  setTemplateFile: (file: File | null) => void;
  setSetting: (key: keyof EmployeeSettings, value: string) => void;
  loadPdf: (file: File) => Promise<void>;
  clearCurrentEditingData: () => void;
  toggleCommuteEntry: (id: string) => void;
  setAllCommuteEntries: (selected: boolean) => void;
  toggleCommuteFareItem: (entryId: string, itemId: string) => void;
  setCommuteEntryRoute: (id: string, route: string) => void;
  setCommuteEntryFare: (id: string, fare: number) => void;
  setCommuteEntryField: (
    id: string,
    key: "companyName" | "workLocation" | "startTime" | "endTime",
    value: string,
  ) => void;
  setCommuteRouteField: (
    routeKey: string,
    key: "companyName" | "workLocation" | "startTime" | "endTime",
    value: string,
  ) => void;
  saveCompanyDataEntry: (input: CompanyDataInput, id?: string) => string;
  deleteCompanyDataEntry: (id: string) => void;
  applyCompanyDataToRoute: (routeKey: string, companyDataId: string) => void;
  applyCompanyDataToEntry: (entryId: string, companyDataId: string) => void;
  clearCompanyDataSelection: (routeKey: string) => void;
  clearCompanyDataSelectionForEntry: (entryId: string) => void;
  generate: () => Promise<void>;
};

const defaultSettings: EmployeeSettings = {
  branch: "東京",
  employeeId: "12345",
  name: "太郎 誠",
};
const defaultTemplateUrl = `${import.meta.env.BASE_URL}templates/default-timesheet.xlsx`;
const templateMimeType =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const initialEditingDraft = loadEditingDraft();

export const useAppStore = create<AppState>((set, get) => ({
  status: initialEditingDraft ? "ready" : "idle",
  message: initialEditingDraft ? "前回の編集中データを復元しました。" : "",
  pdfFileName: initialEditingDraft?.pdfFileName ?? "",
  templateFile: null,
  templateSource: null,
  defaultTemplateLoading: false,
  reportDate: initialEditingDraft?.reportDate ?? "",
  commuteEntries: initialEditingDraft?.commuteEntries ?? [],
  generated: [],
  settings: loadEmployeeSettings(defaultSettings),
  companyData: loadCompanyData(),

  initializeDefaultTemplate: async () => {
    const { defaultTemplateLoading, templateFile } = get();
    if (defaultTemplateLoading || templateFile) {
      return;
    }

    set({ defaultTemplateLoading: true });
    try {
      const response = await fetch(defaultTemplateUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const file = new File([blob], "default-timesheet.xlsx", {
        type: templateMimeType,
      });
      if (!get().templateFile) {
        set({ templateFile: file, templateSource: "default", generated: [] });
      }
    } catch {
      if (!get().templateFile) {
        set({
          message: "既定テンプレートを読み込めませんでした。Excelを選択してください。",
        });
      }
    } finally {
      set({ defaultTemplateLoading: false });
    }
  },

  setTemplateFile: (file) =>
    set({
      templateFile: file,
      templateSource: file ? "custom" : null,
      generated: [],
    }),

  setSetting: (key, value) =>
    set((state) => {
      const settings = { ...state.settings, [key]: value };
      saveEmployeeSettings(settings);
      return { settings };
    }),

  loadPdf: async (file) => {
    set({
      status: "extracting",
      message: "PDFを解析中",
      pdfFileName: file.name,
      commuteEntries: [],
      generated: [],
      reportDate: "",
    });

    try {
      const result = await extractSuicaFromPdfFile(file);
      if (result.records.length === 0) {
        set({
          status: "error",
          message:
            "履歴を読み取れませんでした。モバイルSuicaのSF（電子マネー）利用履歴から保存した、文字を選択できるPDFか確認してください。",
          reportDate: result.reportDate,
          commuteEntries: [],
        });
        return;
      }

      const commuteEntries = applyFirstMatchingCompanyData(
        transformCommute(result.records),
        get().companyData,
      );
      set({
        status: "ready",
        message: `${result.records.length}件の履歴から${commuteEntries.length}日分の通勤を作成しました。`,
        reportDate: result.reportDate,
        commuteEntries,
      });
    } catch (error) {
      set({
        status: "error",
        message: error instanceof Error ? error.message : "PDF解析に失敗しました。",
      });
    }
  },

  clearCurrentEditingData: () => {
    clearEditingDraft();
    set({
      status: "idle",
      message: "",
      pdfFileName: "",
      reportDate: "",
      commuteEntries: [],
      generated: [],
    });
  },

  toggleCommuteEntry: (id) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) =>
        entry.id === id ? { ...entry, selected: !entry.selected } : entry,
      ),
      generated: [],
    })),

  setAllCommuteEntries: (selected) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) => ({ ...entry, selected })),
      generated: [],
    })),

  toggleCommuteFareItem: (entryId, itemId) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) => {
        if (entry.id !== entryId || !entry.fareItems) {
          return entry;
        }

        const fareItems = entry.fareItems.map((item) =>
          item.id === itemId ? { ...item, selected: !item.selected } : item,
        );
        const roundTripFare = fareItems.reduce(
          (total, item) => total + (item.selected ? item.amount : 0),
          0,
        );

        return { ...entry, fareItems, roundTripFare };
      }),
      generated: [],
    })),

  setCommuteEntryRoute: (id, route) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) => {
        if (entry.id !== id) {
          return entry;
        }

        const updated = {
          ...entry,
          route,
          routeKey: normalizeRouteKey(route),
        };
        return entry.routeKey === updated.routeKey
          ? updated
          : clearWorkplaceFields(updated);
      }),
      generated: [],
    })),

  setCommuteEntryFare: (id, fare) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) =>
        entry.id === id
          ? { ...entry, roundTripFare: Number.isFinite(fare) && fare >= 0 ? Math.round(fare) : 0 }
          : entry,
      ),
      generated: [],
    })),

  setCommuteEntryField: (id, key, value) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) =>
        entry.id === id ? { ...entry, [key]: value } : entry,
      ),
      generated: [],
    })),

  setCommuteRouteField: (routeKey, key, value) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) =>
        entry.routeKey === routeKey
          ? { ...entry, [key]: value }
          : entry,
      ),
      generated: [],
    })),

  saveCompanyDataEntry: (input, id) => {
    let savedId = id ?? "";
    set((state) => {
      const result = upsertCompanyData(state.companyData, input, id);
      savedId = result.saved.id;
      saveCompanyData(result.records);

      const commuteEntries = state.commuteEntries.map((entry) => {
        if (entry.companyDataId !== result.saved.id) {
          return entry;
        }

        return {
          ...entry,
          companyName: result.saved.companyName,
          workLocation: result.saved.workLocation,
          startTime: result.saved.startTime,
          endTime: result.saved.endTime,
        };
      });

      return {
        companyData: result.records,
        commuteEntries,
        generated: [],
      };
    });
    return savedId;
  },

  deleteCompanyDataEntry: (id) =>
    set((state) => {
      const companyData = removeCompanyData(state.companyData, id);
      saveCompanyData(companyData);

      return {
        companyData,
        commuteEntries: state.commuteEntries.map((entry) =>
          entry.companyDataId === id
            ? clearWorkplaceFields(entry)
            : entry,
        ),
        generated: [],
      };
    }),

  applyCompanyDataToRoute: (routeKey, companyDataId) =>
    set((state) => {
      const selected = state.companyData.find((record) => record.id === companyDataId);
      if (!selected) {
        return {};
      }

      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === routeKey
          ? applyCompanyData(entry, selected)
          : entry,
      );

      return { commuteEntries, generated: [] };
    }),

  applyCompanyDataToEntry: (entryId, companyDataId) =>
    set((state) => {
      const selected = state.companyData.find((record) => record.id === companyDataId);
      if (!selected) {
        return {};
      }

      return {
        commuteEntries: state.commuteEntries.map((entry) =>
          entry.id === entryId ? applyCompanyData(entry, selected) : entry,
        ),
        generated: [],
      };
    }),

  clearCompanyDataSelection: (routeKey) =>
    set((state) => {
      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === routeKey
          ? clearWorkplaceFields(entry)
          : entry,
      );

      return { commuteEntries, generated: [] };
    }),

  clearCompanyDataSelectionForEntry: (entryId) =>
    set((state) => ({
      commuteEntries: state.commuteEntries.map((entry) =>
        entry.id === entryId ? clearWorkplaceFields(entry) : entry,
      ),
      generated: [],
    })),

  generate: async () => {
    const { commuteEntries, templateFile, settings } = get();
    if (!templateFile) {
      set({ status: "error", message: "テンプレートExcelを選択してください。" });
      return;
    }

    const selectedEntries = commuteEntries.filter((entry) => entry.selected);
    if (selectedEntries.length === 0) {
      set({ status: "error", message: "生成対象の通勤日がありません。" });
      return;
    }

    const missingInputCount = selectedEntries.filter(
      (entry) => !entry.companyDataId,
    ).length;
    set({
      status: "generating",
      message:
        missingInputCount > 0
          ? `勤務先テンプレート未選択または入力不足の日が${missingInputCount}件あります。空欄のままExcelを生成中です。`
          : "Excelを生成中",
      generated: [],
    });

    try {
      const generated = await generateTimesheets(
        templateFile,
        selectedEntries,
        settings,
      );
      generated.forEach(downloadWorkbook);
      set({
        status: "ready",
        message:
          missingInputCount > 0
            ? `${generated.length}件のExcelを生成しました。勤務先情報が不足する${missingInputCount}件は空欄で出力しました。`
            : `${generated.length}件のExcelを生成しました。`,
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

useAppStore.subscribe((state, previousState) => {
  if (
    state.pdfFileName === previousState.pdfFileName &&
    state.reportDate === previousState.reportDate &&
    state.commuteEntries === previousState.commuteEntries
  ) {
    return;
  }

  if (state.commuteEntries.length > 0) {
    saveEditingDraft({
      pdfFileName: state.pdfFileName,
      reportDate: state.reportDate,
      commuteEntries: state.commuteEntries,
    });
  }
});

function clearWorkplaceFields(entry: CommuteEntry): CommuteEntry {
  return {
    ...entry,
    companyName: "",
    workLocation: "",
    startTime: "",
    endTime: "",
    companyDataId: undefined,
  };
}
