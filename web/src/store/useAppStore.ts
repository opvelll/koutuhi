import { create } from "zustand";

import type {
  CompanyData,
  CompanyDataInput,
  CommuteEntry,
  EmployeeSettings,
  ExtractStatus,
  GeneratedWorkbook,
  RouteProfileMap,
  SuicaRecord,
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
  pdfFileName: string;
  templateFile: File | null;
  templateSource: TemplateSource | null;
  defaultTemplateLoading: boolean;
  reportDate: string;
  records: SuicaRecord[];
  commuteEntries: CommuteEntry[];
  generated: GeneratedWorkbook[];
  settings: EmployeeSettings;
  routeProfiles: RouteProfileMap;
  companyData: CompanyData[];
  initializeDefaultTemplate: () => Promise<void>;
  setTemplateFile: (file: File | null) => void;
  setSetting: (key: keyof EmployeeSettings, value: string) => void;
  loadPdf: (file: File) => Promise<void>;
  clearCurrentEditingData: () => void;
  toggleCommuteEntry: (id: string) => void;
  setAllCommuteEntries: (selected: boolean) => void;
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
  clearCompanyDataSelection: (routeKey: string) => void;
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
const initialEditingDraft = loadEditingDraft();

export const useAppStore = create<AppState>((set, get) => ({
  status: initialEditingDraft ? "ready" : "idle",
  message: initialEditingDraft ? "前回の編集中データを復元しました。" : "",
  pdfFile: null,
  pdfFileName: initialEditingDraft?.pdfFileName ?? "",
  templateFile: null,
  templateSource: null,
  defaultTemplateLoading: false,
  reportDate: initialEditingDraft?.reportDate ?? "",
  records: initialEditingDraft?.records ?? [],
  commuteEntries: initialEditingDraft?.commuteEntries ?? [],
  generated: [],
  settings: loadEmployeeSettings(defaultSettings),
  routeProfiles: loadRouteProfiles(),
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
      pdfFile: file,
      pdfFileName: file.name,
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

  clearCurrentEditingData: () => {
    clearEditingDraft();
    set({
      status: "idle",
      message: "",
      pdfFile: null,
      pdfFileName: "",
      reportDate: "",
      records: [],
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

  setCommuteEntryField: (id, key, value) =>
    set((state) => {
      const target = state.commuteEntries.find((entry) => entry.id === id);
      if (!target) {
        return {};
      }

      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === target.routeKey
          ? {
              ...entry,
              [key]: value,
            }
          : entry,
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
            updated.startTime,
            updated.endTime,
            updated.companyDataId,
          )
        : state.routeProfiles;
      saveRouteProfiles(routeProfiles);

      return { commuteEntries, routeProfiles, generated: [] };
    }),

  setCommuteRouteField: (routeKey, key, value) =>
    set((state) => {
      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === routeKey
          ? {
              ...entry,
              [key]: value,
            }
          : entry,
      );
      const updated = commuteEntries.find((entry) => entry.routeKey === routeKey);
      if (!updated) {
        return {};
      }

      const routeProfiles = setRouteProfile(
        state.routeProfiles,
        routeKey,
        updated.companyName,
        updated.workLocation,
        updated.startTime,
        updated.endTime,
        updated.companyDataId,
      );
      saveRouteProfiles(routeProfiles);

      return { commuteEntries, routeProfiles, generated: [] };
    }),

  saveCompanyDataEntry: (input, id) => {
    let savedId = id ?? "";
    set((state) => {
      const result = upsertCompanyData(state.companyData, input, id);
      savedId = result.saved.id;
      saveCompanyData(result.records);

      let routeProfiles = state.routeProfiles;
      const affectedRouteKeys = new Set<string>();
      const commuteEntries = state.commuteEntries.map((entry) => {
        if (entry.companyDataId !== result.saved.id) {
          return entry;
        }

        affectedRouteKeys.add(entry.routeKey);
        return {
          ...entry,
          companyName: result.saved.companyName,
          workLocation: result.saved.workLocation,
          startTime: result.saved.startTime,
          endTime: result.saved.endTime,
        };
      });

      for (const routeKey of affectedRouteKeys) {
        routeProfiles = setRouteProfile(
          routeProfiles,
          routeKey,
          result.saved.companyName,
          result.saved.workLocation,
          result.saved.startTime,
          result.saved.endTime,
          result.saved.id,
        );
      }
      saveRouteProfiles(routeProfiles);

      return {
        companyData: result.records,
        commuteEntries,
        routeProfiles,
        generated: [],
      };
    });
    return savedId;
  },

  deleteCompanyDataEntry: (id) =>
    set((state) => {
      const companyData = removeCompanyData(state.companyData, id);
      saveCompanyData(companyData);
      const routeProfiles = Object.fromEntries(
        Object.entries(state.routeProfiles).map(([routeKey, profile]) => [
          routeKey,
          profile.companyDataId === id
            ? { ...profile, companyDataId: undefined }
            : profile,
        ]),
      );
      saveRouteProfiles(routeProfiles);

      return {
        companyData,
        routeProfiles,
        commuteEntries: state.commuteEntries.map((entry) =>
          entry.companyDataId === id
            ? { ...entry, companyDataId: undefined }
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
          ? {
              ...entry,
              companyName: selected.companyName,
              workLocation: selected.workLocation,
              startTime: selected.startTime,
              endTime: selected.endTime,
              companyDataId: selected.id,
            }
          : entry,
      );
      const routeProfiles = setRouteProfile(
        state.routeProfiles,
        routeKey,
        selected.companyName,
        selected.workLocation,
        selected.startTime,
        selected.endTime,
        selected.id,
      );
      saveRouteProfiles(routeProfiles);

      return { commuteEntries, routeProfiles, generated: [] };
    }),

  clearCompanyDataSelection: (routeKey) =>
    set((state) => {
      const commuteEntries = state.commuteEntries.map((entry) =>
        entry.routeKey === routeKey
          ? { ...entry, companyDataId: undefined }
          : entry,
      );
      const updated = commuteEntries.find((entry) => entry.routeKey === routeKey);
      if (!updated) {
        return {};
      }
      const routeProfiles = setRouteProfile(
        state.routeProfiles,
        routeKey,
        updated.companyName,
        updated.workLocation,
        updated.startTime,
        updated.endTime,
      );
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
            ? {
                ...entry,
                companyName: "",
                workLocation: "",
                startTime: "",
                endTime: "",
                companyDataId: undefined,
              }
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
          startTime: "",
          endTime: "",
          companyDataId: undefined,
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
    state.records === previousState.records &&
    state.commuteEntries === previousState.commuteEntries
  ) {
    return;
  }

  if (state.commuteEntries.length > 0) {
    saveEditingDraft({
      pdfFileName: state.pdfFileName,
      reportDate: state.reportDate,
      records: state.records,
      commuteEntries: state.commuteEntries,
    });
  }
});

function hydrateCommuteEntries(
  records: SuicaRecord[],
  routeProfiles: RouteProfileMap,
): CommuteEntry[] {
  return applyRouteProfiles(transformCommute(records), routeProfiles);
}
