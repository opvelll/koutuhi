import {
  CheckSquare,
  Download,
  FileSpreadsheet,
  Play,
  Printer,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef } from "react";

import { downloadWorkbook } from "../lib/excelGenerator";
import { useAppStore } from "../store/useAppStore";

export function MainToolPage() {
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
    initializeDefaultTemplate,
    loadPdf,
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
    status === "extracting" || status === "generating";
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
  const templateButtonLabel = templateFile ? "Excelテンプレートを変更" : "Excelテンプレートを選択";

  useEffect(() => {
    void initializeDefaultTemplate();
  }, [initializeDefaultTemplate]);

  return (
    <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm leading-6 text-blue-950">
        <strong>4つのステップで作成・提出できます。</strong>
        <span className="ml-2">
          PDFとExcelはこのブラウザ内で処理され、外部の解析サービスには送信されません。
        </span>
      </section>

      <StepSection
        description="モバイルSuicaから保存した「SF（電子マネー）利用履歴」のPDFを読み込みます。読み込み後、通勤日と交通費を自動で整理します。"
        step="1"
        title="Suica利用履歴PDFを読み込む"
      >
        <div className="space-y-4">
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
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-base font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isBusy}
            type="button"
            onClick={() => pdfInputRef.current?.click()}
          >
            <Upload className="h-5 w-5" />
            Suica利用履歴PDFを選択
          </button>
          <FileName label="選択中のPDF" value={pdfFile?.name} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="読込履歴" value={records.length} />
          <Metric label="通勤日" value={commuteEntries.length} />
          <Metric label="保存済み経路" value={Object.keys(routeProfiles).length} />
          <Metric label="対象年月" value={reportDate || "-"} compact />
        </div>

        <StatusMessage message={message} />
      </StepSection>

      <StepSection
        description="Excelに出力する日を選び、会社名と勤務場所を確認してください。入力した内容は通勤経路ごとに保存され、次回以降も自動で入ります。"
        step="2"
        title="通勤履歴を確認・入力する"
      >
        <div className="mb-5 space-y-3">
          <div className="text-sm font-medium text-slate-700">
            出力対象：{selectedCount}件 / 全{commuteEntries.length}件
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={commuteEntries.length === 0}
              type="button"
              onClick={() => setAllCommuteEntries(true)}
            >
              <CheckSquare className="h-4 w-4" />
              すべて選択
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={commuteEntries.length === 0}
              type="button"
              onClick={() => setAllCommuteEntries(false)}
            >
              <Square className="h-4 w-4" />
              選択をすべて解除
            </button>
            <button
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={Object.keys(routeProfiles).length === 0}
              type="button"
              onClick={resetRouteProfiles}
            >
              <Trash2 className="h-4 w-4" />
              保存した会社名・勤務場所をリセット
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100vh-288px)] overflow-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[1120px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-slate-100 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="w-16 border-b border-slate-200 px-3 py-3">選択</th>
                <th className="w-28 border-b border-slate-200 px-3 py-3">日付</th>
                <th className="border-b border-slate-200 px-3 py-3">通勤経路</th>
                <th className="w-28 border-b border-slate-200 px-3 py-3 text-right">電車等</th>
                <th className="w-64 border-b border-slate-200 px-3 py-3">会社名</th>
                <th className="w-72 border-b border-slate-200 px-3 py-3">勤務場所</th>
                <th className="w-20 border-b border-slate-200 px-3 py-3 text-center">保存</th>
              </tr>
            </thead>
            <tbody>
              {commuteEntries.length === 0 ? (
                <tr>
                  <td className="h-64 px-3 text-center text-sm text-slate-500" colSpan={7}>
                    {isBusy ? "PDFを処理しています" : "ステップ1でSuica利用履歴PDFを読み込んでください"}
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
                          aria-label={`${formatDate(entry.date)}を出力対象にする`}
                          className="h-4 w-4 rounded border-slate-300"
                          checked={entry.selected}
                          type="checkbox"
                          onChange={() => toggleCommuteEntry(entry.id)}
                        />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{formatDate(entry.date)}</td>
                      <td className="px-3 py-2">{entry.route}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">{formatYen(entry.roundTripFare)}</td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`${formatDate(entry.date)}の会社名`}
                          className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-950 outline-none focus:border-slate-500"
                          value={entry.companyName}
                          onChange={(event) => setCommuteEntryField(entry.id, "companyName", event.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          aria-label={`${formatDate(entry.date)}の勤務場所`}
                          className="h-9 w-full rounded-md border border-slate-300 px-2 text-sm text-slate-950 outline-none focus:border-slate-500"
                          value={entry.workLocation}
                          onChange={(event) => setCommuteEntryField(entry.id, "workLocation", event.target.value)}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          aria-label={`${entry.route}の保存値を削除`}
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

      <StepSection
        description="社員情報と使用するExcelテンプレートを確認し、提出用の勤務表及び交通費請求書を作成します。"
        step="3"
        title="交通費請求書Excelを作成する"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold">社員情報</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              支社、社員ID、氏名はこのブラウザに保存され、次回も利用できます。
            </p>
            <div className="mt-4 grid max-w-3xl grid-cols-1 gap-4">
              <TextField label="支社" value={settings.branch} onChange={(value) => setSetting("branch", value)} />
              <TextField label="社員ID" value={settings.employeeId} onChange={(value) => setSetting("employeeId", value)} />
              <TextField label="氏名" value={settings.name} onChange={(value) => setSetting("name", value)} />
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold">Excelテンプレート</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              通常は同梱のサンエスExcelテンプレートをそのまま使用できます。
            </p>
            <input
              ref={templateInputRef}
              className="hidden"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setTemplateFile(event.target.files?.[0] ?? null)}
            />
            <div className="mt-4 rounded-lg border border-slate-300 bg-white p-4">
              <div className="flex items-start gap-3">
                <FileSpreadsheet className="mt-0.5 h-5 w-5 flex-none text-slate-700" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-700">現在のExcelテンプレート</div>
                  <div className="mt-1 truncate text-sm font-semibold text-slate-950">{templateTitle}</div>
                  <div className="mt-1 truncate text-xs text-slate-600">{templateDetail}</div>
                </div>
              </div>
              <button
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-100"
                type="button"
                onClick={() => templateInputRef.current?.click()}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {templateButtonLabel}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold">出力内容の確認</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              出力対象と未入力件数を確認してからExcelを作成してください。
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Metric label="出力対象" value={selectedCount} />
              <Metric label="未入力" value={missingInputCount} />
              <Metric label="通勤日" value={commuteEntries.length} />
              <Metric label="出力月" value={reportDate || "-"} compact />
            </div>
          </div>

          {missingInputCount > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
              会社名または勤務場所が未入力の日が{missingInputCount}件あります。未入力欄は空欄のまま出力されます。
            </div>
          ) : null}

          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-base font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={!canGenerate}
            type="button"
            onClick={() => void generate()}
          >
            <Play className="h-5 w-5" />
            交通費請求書Excelを作成
          </button>

          {generated.length > 0 ? (
            <div className="space-y-3 border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold">作成したExcelをダウンロード</h3>
              {generated.map((workbook) => (
                <button
                  key={workbook.fileName}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium hover:bg-slate-100"
                  type="button"
                  onClick={() => downloadWorkbook(workbook)}
                >
                  <Download className="h-4 w-4" />
                  {workbook.fileName}をダウンロード
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </StepSection>

      <StepSection
        description="紙で提出する場合の一般的な流れです。必要書類や提出方法は支社によって異なる場合があるため、所属支社の案内を確認してください。"
        step="4"
        title="印刷して提出する"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-white text-slate-800 ring-1 ring-slate-200">
              <Printer className="h-5 w-5" />
            </div>
            <ol className="space-y-3 text-sm leading-7 text-slate-700">
              <li>
                <strong className="text-slate-950">1. 内容を確認する：</strong>
                ダウンロードしたExcelを開き、日付、経路、金額、会社名、勤務場所を確認します。
              </li>
              <li>
                <strong className="text-slate-950">2. 2種類の書類を印刷する：</strong>
                作成した交通費請求書Excelと、ステップ1で使用したSuica利用履歴PDFを印刷します。
              </li>
              <li>
                <strong className="text-slate-950">3. 所属支社へ提出する：</strong>
                必要書類と提出先を所属支社に確認し、案内された方法で提出します。
              </li>
            </ol>
          </div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            支社によっては印刷する書類や提出方法が異なる場合があります。提出前に所属支社へ確認してください。
          </p>
        </div>
      </StepSection>
    </main>
  );
}

function StepSection({
  step,
  title,
  description,
  children,
}: {
  step: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-4 border-b border-slate-200 pb-5">
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-950 text-base font-semibold text-white">
          {step}
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function StatusMessage({ message }: { message: string }) {
  return (
    <div className="mt-5 min-h-7 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
      {message || "PDFを選択すると、ここに処理状況が表示されます。"}
    </div>
  );
}

function FileName({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-h-6 truncate rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
      <span className="font-medium text-slate-800">{label}: </span>
      {value ?? "まだ選択されていません"}
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
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-normal text-slate-950 outline-none focus:border-slate-500"
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
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={compact ? "mt-1 truncate font-mono text-sm font-semibold" : "mt-1 text-xl font-semibold"}>
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
