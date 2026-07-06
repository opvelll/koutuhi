import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { transformCommute } from "./lib/suicaTransform";
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
    generated,
    settings,
    ocrProgress,
    initializeDefaultTemplate,
    loadPdf,
    runOcr,
    setTemplateFile,
    setSetting,
    toggleRecord,
    setAllEligible,
    generate,
  } = useAppStore();

  const selectedRecords = useMemo(
    () => records.filter((record) => record.selected),
    [records],
  );
  const eligibleCount = records.filter((record) => record.selectable).length;
  const selectedCount = selectedRecords.length;
  const commuteEntries = useMemo(
    () => transformCommute(selectedRecords),
    [selectedRecords],
  );
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

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-0 border-x border-slate-200 bg-white lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 p-5 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r">
          <section className="space-y-5">
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

            <div className="grid grid-cols-2 gap-2">
              <Metric label="履歴" value={records.length} />
              <Metric label="選択" value={selectedCount} />
              <Metric label="通勤日" value={commuteEntries.length} />
              <Metric label="出力日" value={reportDate || "-"} compact />
            </div>

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
              <div className="space-y-2 border-t border-slate-200 pt-4">
                {generated.map((workbook) => (
                  <button
                    key={workbook.fileName}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-2 text-xs font-medium hover:bg-slate-100"
                    type="button"
                    onClick={() => downloadWorkbook(workbook)}
                  >
                    <Download className="h-4 w-4" />
                    {workbook.fileName}
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <section className="min-w-0 p-5">
          <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
            <div className="min-h-6 text-sm text-slate-700">
              {message}
              {ocrProgress ? (
                <span className="ml-2 text-slate-500">
                  {ocrProgress.status} {Math.round(ocrProgress.progress * 100)}%
                </span>
              ) : null}
            </div>
            <div className="flex gap-2">
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={eligibleCount === 0}
                type="button"
                onClick={() => setAllEligible(true)}
              >
                <CheckSquare className="h-4 w-4" />
                全選択
              </button>
              <button
                className="flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={eligibleCount === 0}
                type="button"
                onClick={() => setAllEligible(false)}
              >
                <Square className="h-4 w-4" />
                解除
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-174px)] overflow-auto border border-slate-200">
            <table className="min-w-[920px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
                <tr>
                  <th className="w-16 border-b border-slate-200 px-3 py-3">
                    選択
                  </th>
                  <th className="w-28 border-b border-slate-200 px-3 py-3">
                    日付
                  </th>
                  <th className="w-20 border-b border-slate-200 px-3 py-3">
                    種別1
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    利用駅1
                  </th>
                  <th className="w-20 border-b border-slate-200 px-3 py-3">
                    種別2
                  </th>
                  <th className="border-b border-slate-200 px-3 py-3">
                    利用駅2
                  </th>
                  <th className="w-28 border-b border-slate-200 px-3 py-3 text-right">
                    支払額
                  </th>
                  <th className="w-28 border-b border-slate-200 px-3 py-3 text-right">
                    残額
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      className="h-72 px-3 text-center text-sm text-slate-500"
                      colSpan={8}
                    >
                      {isBusy ? "処理中" : "PDF未読込"}
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr
                      key={record.id}
                      className={
                        record.selectable
                          ? "border-b border-slate-100 hover:bg-slate-50"
                          : "border-b border-slate-100 bg-slate-50 text-slate-400"
                      }
                    >
                      <td className="px-3 py-2">
                        <input
                          className="h-4 w-4 rounded border-slate-300"
                          checked={record.selected}
                          disabled={!record.selectable}
                          type="checkbox"
                          onChange={() => toggleRecord(record.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-3 py-2">{record.type1}</td>
                      <td className="px-3 py-2">{record.station1}</td>
                      <td className="px-3 py-2">{record.type2}</td>
                      <td className="px-3 py-2">{record.station2}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {formatSigned(record.amount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {formatYen(record.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
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

function formatSigned(value: number): string {
  return value.toLocaleString("ja-JP", { signDisplay: "exceptZero" });
}

function formatYen(value: number): string {
  return value.toLocaleString("ja-JP");
}
