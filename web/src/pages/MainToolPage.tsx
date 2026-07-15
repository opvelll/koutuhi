import {
  CheckSquare,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { downloadWorkbook } from "../lib/excelGenerator";
import { groupCommuteEntriesByRoute } from "../lib/commuteRoutes";
import { useAppStore } from "../store/useAppStore";

type WorkflowStep = 1 | 2 | 3;

export function MainToolPage() {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState<WorkflowStep>(1);
  const {
    status,
    message,
    pdfFile,
    templateFile,
    templateSource,
    defaultTemplateLoading,
    reportDate,
    commuteEntries,
    generated,
    settings,
    routeProfiles,
    initializeDefaultTemplate,
    loadPdf,
    setTemplateFile,
    setSetting,
    toggleCommuteEntry,
    setAllCommuteEntries,
    setCommuteRouteField,
    clearRouteProfile,
    resetRouteProfiles,
    generate,
  } = useAppStore();

  const selectedEntries = useMemo(
    () => commuteEntries.filter((entry) => entry.selected),
    [commuteEntries],
  );
  const routeRows = useMemo(
    () => groupCommuteEntriesByRoute(commuteEntries),
    [commuteEntries],
  );
  const selectedCount = selectedEntries.length;
  const missingInputCount = selectedEntries.filter(
    (entry) => !entry.companyName.trim() || !entry.workLocation.trim(),
  ).length;
  const isBusy = status === "extracting" || status === "generating";
  const canGenerate = selectedCount > 0 && Boolean(templateFile) && !isBusy;
  const templateTitle =
    templateSource === "default"
      ? "サンエスExcelテンプレート"
      : templateFile
        ? templateFile.name
        : defaultTemplateLoading
          ? "テンプレートを読み込み中"
          : "Excelテンプレート未選択";

  useEffect(() => {
    void initializeDefaultTemplate();
  }, [initializeDefaultTemplate]);

  async function handlePdf(file: File) {
    await loadPdf(file);
    if (useAppStore.getState().commuteEntries.length > 0) {
      setActiveStep(2);
    }
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="divide-y divide-slate-200">
        <Step
          active={activeStep === 1}
          available
          completed={commuteEntries.length > 0 && activeStep !== 1}
          number={1}
          summary={
            commuteEntries.length > 0
              ? `${formatReportDate(reportDate)}・通勤${commuteEntries.length}日`
              : undefined
          }
          title="PDFを選ぶ"
          onOpen={() => setActiveStep(1)}
        >
          <div className="max-w-2xl space-y-4">
            <input
              ref={pdfInputRef}
              className="hidden"
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handlePdf(file);
              }}
            />
            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-base font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              disabled={isBusy}
              type="button"
              onClick={() => pdfInputRef.current?.click()}
            >
              {status === "extracting" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {status === "extracting" ? "PDFを読み込み中" : "Suica利用履歴PDFを選択"}
            </button>
            {pdfFile ? (
              <p className="text-sm text-slate-600">選択中：{pdfFile.name}</p>
            ) : null}
            {status === "error" && activeStep === 1 ? (
              <InlineMessage tone="error">{message}</InlineMessage>
            ) : null}
          </div>
        </Step>

        <Step
          active={activeStep === 2}
          available={commuteEntries.length > 0}
          completed={activeStep === 3}
          number={2}
          summary={activeStep === 3 ? `出力対象 ${selectedCount}日` : undefined}
          title="内容を確認・入力する"
          onOpen={() => setActiveStep(2)}
        >
          <div className="space-y-12">
            <section aria-labelledby="target-days-heading">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold" id="target-days-heading">出力する日</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Excelに含める日を選び、日付・経路・金額を確認します。
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2" aria-label="出力日の一括操作">
                  <span className="mr-2 text-sm font-medium text-slate-700">
                    {selectedCount} / {commuteEntries.length}日を選択
                  </span>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-50 px-3 text-sm font-medium text-blue-800 hover:bg-blue-100"
                    type="button"
                    onClick={() => setAllCommuteEntries(true)}
                  >
                    <CheckSquare className="h-4 w-4" />
                    すべて選択
                  </button>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    type="button"
                    onClick={() => setAllCommuteEntries(false)}
                  >
                    <Square className="h-4 w-4" />
                    すべて解除
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto border-y border-slate-200">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead className="bg-slate-100/70 text-left text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="w-20 px-4 py-3">対象</th>
                      <th className="w-36 px-4 py-3">日付</th>
                      <th className="px-4 py-3">通勤経路</th>
                      <th className="w-32 px-4 py-3 text-right">往復交通費</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {commuteEntries.map((entry) => (
                      <tr className={entry.selected ? "" : "text-slate-400"} key={entry.id}>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`${formatDate(entry.date)}を出力対象にする`}
                            className="h-4 w-4 rounded border-slate-300 text-blue-700"
                            checked={entry.selected}
                            type="checkbox"
                            onChange={() => toggleCommuteEntry(entry.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{formatDate(entry.date)}</td>
                        <td className="px-4 py-3">{entry.route}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatYen(entry.roundTripFare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-labelledby="route-information-heading">
              <div>
                <h3 className="text-lg font-semibold" id="route-information-heading">経路ごとの入力情報</h3>
                <p className="mt-1 text-sm text-slate-600">
                  同じ経路の会社名と勤務場所はまとめて保存され、次回も自動で入ります。
                </p>
              </div>

              <div className="mt-5 overflow-x-auto border-y border-slate-200">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead className="bg-slate-100/70 text-left text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">通勤経路</th>
                      <th className="w-64 px-4 py-3">会社名</th>
                      <th className="w-72 px-4 py-3">勤務場所</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white/60">
                    {routeRows.map((entry) => (
                      <tr key={entry.routeKey}>
                        <td className="px-4 py-4 font-medium text-slate-800">{entry.route}</td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`${entry.route}の会社名`}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-blue-600"
                            value={entry.companyName}
                            onChange={(event) =>
                              setCommuteRouteField(entry.routeKey, "companyName", event.target.value)
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            aria-label={`${entry.route}の勤務場所`}
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-blue-600"
                            value={entry.workLocation}
                            onChange={(event) =>
                              setCommuteRouteField(entry.routeKey, "workLocation", event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <details className="mt-4 text-sm text-slate-600">
                <summary className="w-fit cursor-pointer font-medium text-slate-700 hover:text-blue-700">
                  保存した入力情報を管理
                </summary>
                <div className="mt-4 max-w-3xl space-y-2 border-l-2 border-slate-200 pl-4">
                  {routeRows.map((entry) => (
                    <div className="flex items-center justify-between gap-4 py-1" key={entry.routeKey}>
                      <span className="truncate">{entry.route}</span>
                      <button
                        className="inline-flex flex-none items-center gap-2 px-2 py-1 font-medium text-slate-600 hover:text-red-700 disabled:text-slate-300"
                        disabled={!routeProfiles[entry.routeKey]}
                        type="button"
                        onClick={() => clearRouteProfile(entry.routeKey)}
                      >
                        <Trash2 className="h-4 w-4" />
                        削除
                      </button>
                    </div>
                  ))}
                  <button
                    className="mt-3 inline-flex items-center gap-2 font-medium text-red-700 hover:text-red-800 disabled:text-slate-300"
                    disabled={Object.keys(routeProfiles).length === 0}
                    type="button"
                    onClick={resetRouteProfiles}
                  >
                    <Trash2 className="h-4 w-4" />
                    すべての保存情報を削除
                  </button>
                </div>
              </details>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                {selectedCount > 0 ? `${selectedCount}日分をExcelへ出力します。` : "出力する日を選択してください。"}
              </p>
              <button
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={selectedCount === 0}
                type="button"
                onClick={() => setActiveStep(3)}
              >
                この内容でExcel作成へ
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Step>

        <Step
          active={activeStep === 3}
          available={activeStep === 3}
          completed={generated.length > 0}
          number={3}
          summary={generated.length > 0 ? "Excelを作成しました" : undefined}
          title="Excelを作成する"
          onOpen={() => setActiveStep(3)}
        >
          <div className="space-y-8">
            <section aria-labelledby="output-information-heading">
              <h3 className="text-lg font-semibold" id="output-information-heading">出力情報</h3>
              <div className="mt-5 rounded-xl bg-slate-100/70 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <TextField label="支社" value={settings.branch} onChange={(value) => setSetting("branch", value)} />
                  <TextField label="社員ID" value={settings.employeeId} onChange={(value) => setSetting("employeeId", value)} />
                  <TextField label="氏名" value={settings.name} onChange={(value) => setSetting("name", value)} />
                </div>
                <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 flex-none text-slate-500" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-500">Excelテンプレート</div>
                      <div className="mt-1 truncate text-sm font-semibold text-slate-800">{templateTitle}</div>
                    </div>
                  </div>
                  <input
                    ref={templateInputRef}
                    className="hidden"
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={(event) => setTemplateFile(event.target.files?.[0] ?? null)}
                  />
                  <button
                    className="h-10 flex-none rounded-md px-3 text-sm font-medium text-blue-700 hover:bg-blue-50"
                    type="button"
                    onClick={() => templateInputRef.current?.click()}
                  >
                    テンプレートを変更
                  </button>
                </div>
              </div>
            </section>

            {missingInputCount > 0 ? (
              <InlineMessage tone="warning">
                会社名または勤務場所が未入力の日が{missingInputCount}日あります。未入力欄は空欄で出力されます。
              </InlineMessage>
            ) : null}

            <div className="border-t border-slate-200 pt-6">
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-base font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                disabled={!canGenerate}
                type="button"
                onClick={() => void generate()}
              >
                {status === "generating" ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileSpreadsheet className="h-5 w-5" />}
                {status === "generating" ? "Excelを作成中" : "交通費請求書Excelを作成"}
              </button>
              {status === "error" && activeStep === 3 ? (
                <div className="mt-4"><InlineMessage tone="error">{message}</InlineMessage></div>
              ) : null}
            </div>

            {generated.length > 0 ? (
              <section className="border-t border-blue-200 pt-7" aria-labelledby="generated-heading">
                <p className="text-sm font-semibold text-blue-700">作成完了</p>
                <h3 className="mt-1 text-xl font-semibold" id="generated-heading">Excelをダウンロードできます</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatReportDate(reportDate)}・{selectedCount}日分の交通費請求書を作成しました。
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:items-start">
                  {generated.map((workbook) => (
                    <button
                      key={workbook.fileName}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-blue-50 px-4 text-sm font-semibold text-blue-800 hover:bg-blue-100"
                      type="button"
                      onClick={() => downloadWorkbook(workbook)}
                    >
                      <Download className="h-4 w-4" />
                      {workbook.fileName}をダウンロード
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </Step>
      </div>
    </main>
  );
}

function Step({
  number,
  title,
  summary,
  active,
  completed,
  available,
  onOpen,
  children,
}: {
  number: WorkflowStep;
  title: string;
  summary?: string;
  active: boolean;
  completed: boolean;
  available: boolean;
  onOpen: () => void;
  children: ReactNode;
}) {
  return (
    <section className={active ? "py-8 sm:py-10" : "py-5"}>
      <button
        className="flex w-full items-center gap-4 text-left disabled:cursor-default"
        disabled={!available || active}
        type="button"
        onClick={onOpen}
      >
        <span
          className={
            active
              ? "flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white"
              : completed
                ? "flex h-9 w-9 flex-none items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800"
                : "flex h-9 w-9 flex-none items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-500"
          }
        >
          {number}
        </span>
        <span className="min-w-0 flex-1">
          <span className={active ? "block text-xl font-semibold" : "block font-semibold text-slate-700"}>{title}</span>
          {!active && summary ? <span className="mt-1 block text-sm text-slate-500">{summary}</span> : null}
        </span>
        {!active && available ? <span className="text-sm font-medium text-blue-700">開く</span> : null}
      </button>
      {active ? <div className="mt-7 pl-0 sm:pl-13">{children}</div> : null}
    </section>
  );
}

function InlineMessage({ tone, children }: { tone: "error" | "warning"; children: ReactNode }) {
  return (
    <p
      className={
        tone === "error"
          ? "border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm leading-6 text-red-900"
          : "border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
      }
    >
      {children}
    </p>
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
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none focus:border-blue-600"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatDate(value: string): string {
  return value.replaceAll("/", "-");
}

function formatReportDate(value: string): string {
  if (!value) return "対象年月未設定";
  const [year, month] = value.split("/");
  return month ? `${year}年${Number(month)}月` : value;
}

function formatYen(value: number): string {
  return `${value.toLocaleString("ja-JP")}円`;
}
