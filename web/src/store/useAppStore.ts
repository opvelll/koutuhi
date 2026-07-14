import { create } from "zustand";

import type {
  CommuteEntry,
  EmployeeSettings,
  ExtractStatus,
  GeneratedWorkbook,
  RouteProfileMap,
  SuicaRecord,
} from "../types";
import { downloadWorkbook, generateTimesheets } from "../lib/excelGenerator";
import { extractSuicaFromPdfFile } from "../lib/pdfTextExtractor";
import {
  applyRouteProfiles,
  clearRouteProfiles,
  loadEmployeeSettings,
  loadRouteProfiles,
  saveEmployeeSettings,
  saveRouteProfiles,
  setRouteProfile,
} from "../lib/savedInputs";
import { transformCommute } from "../lib/suicaTransform";

type TemplateSource = "default" | "custom";

type AppState = {
  status: ExtractStatus;
  message: string;
  pdfFile: File | null;
  templateFile: File | null;
  templateSource: TemplateSource | null;
  defaultTemplateLoading: boolean;
  reportDate: string;
  records: SuicaRecord[];
  commuteEntries: CommuteEntry[];
  generated: GeneratedWorkbook[];
  settings: EmployeeSettings;
  routeProfiles: RouteProfileMap;
  initializeDefaultTemplate: () => Promise<void>;
  setTemplateFile: (file: File | null) => void;
  setSetting: (key: keyof EmployeeSettings, value: string) => void;
  loadPdf: (file: File) => Promise<void>;
  toggleCommuteEntry: (id: string) => void;
  setAllCommuteEntries: (selected: boolean) => void;
  setCommuteEntryField: (
    id: string,
    key: "companyName" | "workLocation",
    value: string,
  ) => void;
  clearRouteProfile: (routeKey: string) => void;
  resetRouteProfiles: () => void;
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

export const useAppStore = create<AppState>((set, get) => ({
  status: "idle",
  message: "",
  pdfFile: null,
  templateFile: null,
  templateSource: null,
  defaultTemplateLoading: false,
  reportDate: "",
  records: [],
  commuteEntries: [],
  generated: [],
  settings: loadEmployeeSettings(defaultSettings),
  routeProfiles: loadRouteProfiles(),

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
      pdfFile: file,
      records: [],
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
          records: [],
          commuteEntries: [],
        });
        return;
      }

      const commuteEntries = hydrateCommuteEntries(result.records, get().routeProfiles);
      set({
        status: "ready",
        message: `${result.records.length}件の履歴から${commuteEntries.length}日分の通勤を作成しました。`,
        reportDate: result.reportDate,
        records: result.records,
        commuteEntries,
      });
    } catch (error) {
      set({
        status: "error",
        message: error instanceof Error ? error.message : "PDF解析に失敗しました。",
      });
    }
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

  setCommuteEntryField: (id, key, value) =>
    set((state) => {
      const target = state.commuteEntries.find((entry) => entry.id === id);
      if (!target) {
        return {};
      }

      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === target.routeKey ? { ...entry, [key]: value } : entry,
      );
      const updated = commuteEntries.find(
        (entry) => entry.routeKey === target.routeKey,
      );
      const routeProfiles = updated
        ? setRouteProfile(
            state.routeProfiles,
            target.routeKey,
            updated.companyName,
            updated.workLocation,
          )
        : state.routeProfiles;
      saveRouteProfiles(routeProfiles);

      return { commuteEntries, routeProfiles, generated: [] };
    }),

  clearRouteProfile: (routeKey) =>
    set((state) => {
      const routeProfiles = { ...state.routeProfiles };
      delete routeProfiles[routeKey];
      saveRouteProfiles(routeProfiles);

      return {
        routeProfiles,
        commuteEntries: state.commuteEntries.map((entry) =>
          entry.routeKey === routeKey
            ? { ...entry, companyName: "", workLocation: "" }
            : entry,
        ),
        generated: [],
      };
    }),

  resetRouteProfiles: () =>
    set((state) => {
      clearRouteProfiles();
      return {
        routeProfiles: {},
        commuteEntries: state.commuteEntries.map((entry) => ({
          ...entry,
          companyName: "",
          workLocation: "",
        })),
        generated: [],
      };
    }),

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
      (entry) => !entry.companyName.trim() || !entry.workLocation.trim(),
    ).length;
    set({
      status: "generating",
      message:
        missingInputCount > 0
          ? `会社名または勤務場所が未入力の日が${missingInputCount}件あります。空欄のままExcelを生成中です。`
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
            ? `${generated.length}件のExcelを生成しました。未入力${missingInputCount}件は空欄で出力しました。`
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

function hydrateCommuteEntries(
  records: SuicaRecord[],
  routeProfiles: RouteProfileMap,
): CommuteEntry[] {
  return applyRouteProfiles(transformCommute(records), routeProfiles);
}
