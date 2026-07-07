import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import { downloadWorkbook } from "./lib/excelGenerator";
import { useAppStore } from "./store/useAppStore";

export default function App() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const {
    status,
    message,
    pdfFile,
    templateFile,
    templateSource,
    defaultTemplateLoading,
    reportDate,
    records,
    commuteEntries,
    generated,
    settings,
    routeProfiles,
    ocrProgress,
    initializeDefaultTemplate,
    loadPdf,
    runOcr,
    setTemplateFile,
    setSetting,
    toggleCommuteEntry,
    setAllCommuteEntries,
    setCommuteEntryField,
    clearRouteProfile,
    resetRouteProfiles,
    generate,
  } = useAppStore();

  const selectedEntries = useMemo(
    () => commuteEntries.filter((entry) => entry.selected),
    [commuteEntries],
  );
  const selectedCount = selectedEntries.length;
  const missingInputCount = selectedEntries.filter(
    (entry) => !entry.companyName.trim() || !entry.workLocation.trim(),
  ).length;
  const isBusy =
    status === "extracting" || status === "ocr-running" || status === "generating";
  const canGenerate = selectedCount > 0 && Boolean(templateFile) && !isBusy;
  const templateTitle =
    templateSource === "default"
      ? "サンエスExcelテンプレート"
      : templateFile
        ? "選択したExcelテンプレート"
        : defaultTemplateLoading
          ? "テンプレートを読み込み中"
          : "Excelテンプレート未選択";
  const templateDetail =
    templateSource === "default"
      ? "既定テンプレートを使用中"
      : templateFile?.name ?? "必要に応じてExcelファイルを選択";
  const templateButtonLabel = templateFile ? "Excelを変更" : "Excelを選択";

  useEffect(() => {
    void initializeDefaultTemplate();
  }, [initializeDefaultTemplate]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-normal">
              交通費請求書
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Suica利用履歴PDFから勤務表及び交通費請求書を作成
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <StatusPill status={status} />
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] border-x border-slate-200 bg-white">
        <StepSection step="1" title="PDF読込">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <input
                  ref={pdfInputRef}
                  className="hidden"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void loadPdf(file);
                  }}
                />
                <button
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isBusy}
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  PDF選択
                </button>
                <FileName label="PDF" value={pdfFile?.name} />
                {status === "ocr-ready" ? (
                  <button
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-medium text-amber-950 hover:bg-amber-100"
                    type="button"
                    onClick={() => void runOcr()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    OCR再試行
                  </button>
                ) : null}
              </div>

              <div className="space-y-3">
                <input
                  ref={templateInputRef}
                  className="hidden"
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) =>
                    setTemplateFile(event.target.files?.[0] ?? null)
                  }
                />
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="mt-0.5 h-4 w-4 flex-none text-emerald-800" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-emerald-800">
                        Excelテンプレート
                      </div>
                      <div className="mt-1 truncate text-sm font-semibold text-slate-950">
                        {templateTitle}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-600">
                        {templateDetail}
                      </div>
                    </div>
                  </div>
                  <button
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-md border border-emerald-300 bg-white px-3 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
                    type="button"
                    onClick={() => templateInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {templateButtonLabel}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Metric label="履歴" value={records.length} />
              <Metric label="通勤日" value={commuteEntries.length} />
              <Metric label="保存経路" value={Object.keys(routeProfiles).length} />
              <Metric label="出力日" value={reportDate || "-"} compact />
            </div>
          </div>

          <StatusMessage message={message} ocrProgress={ocrProgress} />
        </StepSection>

        <StepSection step="2" title="内容確認・入力">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-600">
              選択 {selectedCount} / {commuteEntries.length}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={commuteEntries.length === 0}
                type="button"
                onClick={() => setAllCommuteEntries(true)}
              >
                <CheckSquare className="h-4 w-4" />
                全選択
              </button>
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={commuteEntries.length === 0}
                type="button"
                onClick={() => setAllCommuteEntries(false)}
              >
                <Square className="h-4 w-4" />
                解除
              </button>
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={Object.keys(routeProfiles).length === 0}
                type="button"
                onClick={resetRouteProfiles}
              >
                <Trash2 className="h-4 w-4" />
                保存データをリセット
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-288px)] overflow-auto border border-slate-200">
            <table className="w-full min-w-[1120px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-16 border-b border-slate-200 px-3 py-3">
                    選択
                  </th>
                  <th className="w-28 border-b border-slate-200 px-3 py-3">
                    日付
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    通勤経路
                  </th>
                  <th className="w-28 border-b border-slate-200 px-3 py-3 text-right">
                    電車等
                  </th>
                  <th className="w-64 border-b border-slate-200 px-3 py-3">
                    会社名
                  </th>
                  <th className="w-72 border-b border-slate-200 px-3 py-3">
                    勤務場所
                  </th>
                  <th className="w-20 border-b border-slate-200 px-3 py-3 text-center">
                    保存
                  </th>
                </tr>
              </thead>
              <tbody>
                {commuteEntries.length === 0 ? (
                  <tr>
                    <td
                      className="h-64 px-3 text-center text-sm text-slate-500"
                      colSpan={7}
                    >
                      {isBusy ? "処理中" : "PDF未読込"}
                    </td>
                  </tr>
                ) : (
                  commuteEntries.map((entry) => {
                    const hasSavedProfile = Boolean(routeProfiles[entry.routeKey]);
                    const canClear =
                      hasSavedProfile ||
                      Boolean(entry.companyName.trim()) ||
                      Boolean(entry.workLocation.trim());

                    return (
                      <tr
                        key={entry.id}
                        className={
                          entry.selected
                            ? "border-b border-slate-100 hover:bg-slate-50"
                            : "border-b border-slate-100 bg-slate-50 text-slate-500"
                        }
                      >
                        <td className="px-3 py-2">
                          <input
                            className="h-4 w-4 rounded border-slate-300"
                            checked={entry.selected}
                            type="checkbox"
                            onChange={() => toggleCommuteEntry(entry.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-3 py-2">{entry.route}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">
                          {formatYen(entry.roundTripFare)}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-950 outline-none focus:border-slate-500"
                            value={entry.companyName}
                            onChange={(event) =>
                              setCommuteEntryField(
                                entry.id,
                                "companyName",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-950 outline-none focus:border-slate-500"
                            value={entry.workLocation}
                            onChange={(event) =>
                              setCommuteEntryField(
                                entry.id,
                                "workLocation",
                                event.target.value,
                              )
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            className="mx-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                            disabled={!canClear}
                            title="この経路の保存値を消す"
                            type="button"
                            onClick={() => clearRouteProfile(entry.routeKey)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </StepSection>

        <StepSection step="3" title="Excel出力">
          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div className="grid grid-cols-1 gap-3">
              <TextField
                label="支社"
                value={settings.branch}
                onChange={(value) => setSetting("branch", value)}
              />
              <TextField
                label="社員ID"
                value={settings.employeeId}
                onChange={(value) => setSetting("employeeId", value)}
              />
              <TextField
                label="氏名"
                value={settings.name}
                onChange={(value) => setSetting("name", value)}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <Metric label="選択" value={selectedCount} />
                <Metric label="未入力" value={missingInputCount} />
                <Metric label="通勤日" value={commuteEntries.length} />
                <Metric label="出力月" value={reportDate || "-"} compact />
              </div>

              {missingInputCount > 0 ? (
                <div className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                  会社名または勤務場所が未入力の日が{missingInputCount}
                  件あります。未入力欄は空欄で出力されます。
                </div>
              ) : null}

              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canGenerate}
                type="button"
                onClick={() => void generate()}
              >
                <Play className="h-4 w-4" />
                生成
              </button>

              {generated.length > 0 ? (
                <div className="grid gap-2 border-t border-slate-200 pt-4 md:grid-cols-2">
                  {generated.map((workbook) => (
                    <button
                      key={workbook.fileName}
                      className="flex h-9 items-center justify-center gap-2 rounded-md border border-slate-300 px-2 text-xs font-medium hover:bg-slate-100"
                      type="button"
                      onClick={() => downloadWorkbook(workbook)}
                    >
                      <Download className="h-4 w-4" />
                      {workbook.fileName}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </StepSection>
      </div>
    </main>
  );
}

function StepSection({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 p-5 last:border-b-0">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
          {step}
        </div>
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const label =
    status === "idle"
      ? "待機"
      : status === "extracting"
        ? "解析"
        : status === "ready"
          ? "準備完了"
          : status === "ocr-ready"
            ? "OCR待機"
            : status === "ocr-running"
              ? "OCR"
              : status === "generating"
                ? "生成"
                : "エラー";
  const tone =
    status === "ready"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "error"
        ? "bg-red-50 text-red-800 ring-red-200"
        : status === "ocr-ready"
          ? "bg-amber-50 text-amber-900 ring-amber-200"
          : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs ring-1 ${tone}`}>
      {label}
    </span>
  );
}

function StatusMessage({
  message,
  ocrProgress,
}: {
  message: string;
  ocrProgress: { status: string; progress: number } | null;
}) {
  return (
    <div className="mt-4 min-h-6 border-t border-slate-200 pt-3 text-sm text-slate-700">
      {message}
      {ocrProgress ? (
        <span className="ml-2 text-slate-500">
          {ocrProgress.status} {Math.round(ocrProgress.progress * 100)}%
        </span>
      ) : null}
    </div>
  );
}

function FileName({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-h-5 truncate text-xs text-slate-600">
      <span className="font-medium text-slate-800">{label}: </span>
      {value ?? "-"}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-slate-700">
      {label}
      <input
        className="h-9 rounded-md border border-slate-300 px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-500"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Metric({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string | number;
  compact?: boolean;
}) {
  return (
    <div className="border border-slate-200 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={
          compact
            ? "mt-1 truncate font-mono text-xs font-semibold"
            : "mt-1 text-lg font-semibold"
        }
      >
        {value}
      </div>
    </div>
  );
}

function formatDate(value: string): string {
  return value.replaceAll("/", "-");
}

function formatYen(value: number): string {
  return value.toLocaleString("ja-JP");
}
