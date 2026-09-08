import {
  CheckSquare,
  ChevronDown,
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
import { useAppStore } from "../store/useAppStore";
import type { CommuteEntry, CompanyDataInput } from "../types";

type WorkflowStep = 1 | 2 | 3 | 4;

export function MainToolPage({
  onOpenCompanyData,
}: {
  onOpenCompanyData: (initialInput?: CompanyDataInput) => void;
}) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);
  const [activeStep, setActiveStep] = useState<WorkflowStep>(() =>
    useAppStore.getState().commuteEntries.length > 0 ? 2 : 1,
  );
  const [furthestStep, setFurthestStep] = useState<WorkflowStep>(() => activeStep);
  const {
    status,
    message,
    pdfFileName,
    templateFile,
    templateSource,
    defaultTemplateLoading,
    reportDate,
    commuteEntries,
    generated,
    settings,
    companyData,
    initializeDefaultTemplate,
    loadPdf,
    clearCurrentEditingData,
    setTemplateFile,
    setSetting,
    toggleCommuteEntry,
    setAllCommuteEntries,
    toggleCommuteFareItem,
    setCommuteEntryRoute,
    setCommuteEntryFare,
    setCommuteEntryField,
    applyCompanyDataToEntry,
    clearCompanyDataSelectionForEntry,
    generate,
  } = useAppStore();

  const selectedEntries = useMemo(
    () => commuteEntries.filter((entry) => entry.selected),
    [commuteEntries],
  );
  const selectedCount = selectedEntries.length;
  const hasSelectedCompanyData = selectedEntries.some((entry) => Boolean(entry.companyDataId));
  const missingInputCount = selectedEntries.filter(
    (entry) => !entry.companyDataId,
  ).length;
  const configuredDateCount = selectedCount - missingInputCount;
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
      setFurthestStep(2);
    } else {
      setActiveStep(1);
      setFurthestStep(1);
    }
  }

  function advanceTo(step: WorkflowStep) {
    setFurthestStep((current) => Math.max(current, step) as WorkflowStep);
    setActiveStep(step);
  }

  function openPdfPicker() {
    if (!pdfInputRef.current) {
      return;
    }

    pdfInputRef.current.value = "";
    pdfInputRef.current.click();
  }

  function handleClearCurrentEditingData() {
    if (!window.confirm("編集中のPDFデータと入力内容をクリアしますか？")) {
      return;
    }

    clearCurrentEditingData();
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
    setActiveStep(1);
    setFurthestStep(1);
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
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
      <div className="divide-y divide-slate-200">
        <Step
          active={activeStep === 1}
          available
          completed={furthestStep > 1}
          number={1}
          persistentContent={
            pdfFileName ? (
              <div className="flex flex-col gap-3 rounded-lg bg-slate-100/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p
                  className="flex min-w-0 items-center gap-2 text-sm text-slate-600"
                  title={pdfFileName}
                >
                  {status === "extracting" ? (
                    <Loader2 className="h-4 w-4 flex-none animate-spin" />
                  ) : null}
                  <span className="truncate">
                    {status === "extracting"
                      ? "読み込み中"
                      : commuteEntries.length > 0
                        ? "編集中"
                        : "選択中"}
                    ：{pdfFileName}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={isBusy}
                    type="button"
                    onClick={openPdfPicker}
                  >
                    <Upload className="h-4 w-4" />
                    別のSuica利用履歴PDFを選択
                  </button>
                  <button
                    className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                    disabled={isBusy}
                    type="button"
                    onClick={handleClearCurrentEditingData}
                  >
                    <Trash2 className="h-4 w-4" />
                    編集中データをクリア
                  </button>
                </div>
              </div>
            ) : undefined
          }
          summary={
            commuteEntries.length > 0
              ? `${formatReportDate(reportDate)}・通勤${commuteEntries.length}日`
              : undefined
          }
          title="Suica利用履歴PDFを選ぶ"
          onOpen={() => setActiveStep(1)}
        >
          <div className="max-w-2xl space-y-4">
            <p className="text-sm leading-7 text-slate-700">
              モバイルSuicaの「SF（電子マネー）利用履歴」から保存したPDFを選んでください。
            </p>
            {!pdfFileName ? (
              <button
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 text-base font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                disabled={isBusy}
                type="button"
                onClick={openPdfPicker}
              >
                <Upload className="h-5 w-5" />
                Suica利用履歴PDFを選択
              </button>
            ) : null}
            {status === "error" && activeStep === 1 ? (
              <InlineMessage tone="error">{message}</InlineMessage>
            ) : null}
          </div>
        </Step>

        <Step
          active={activeStep === 2}
          available={commuteEntries.length > 0}
          completed={furthestStep > 2}
          number={2}
          summary={furthestStep > 2 ? `出力対象 ${selectedCount}日` : undefined}
          title="通勤履歴を確認する"
          onOpen={() => setActiveStep(2)}
        >
          <div className="space-y-8">
            <section aria-labelledby="target-days-heading">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold" id="target-days-heading">出力する日</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Excelに含める日を選び、日付・経路・往復交通費を確認します。経路は必要に応じて修正できます。
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

              <div className="mt-5 grid gap-4 sm:hidden">
                {commuteEntries.map((entry) => (
                  <article
                    className={
                      entry.selected
                        ? "rounded-xl border-2 border-slate-300 bg-white p-4 shadow-sm"
                        : "rounded-xl border-2 border-slate-300 bg-slate-100 p-4 text-slate-500 shadow-sm"
                    }
                    key={`mobile-${entry.id}`}
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                      <label className="flex items-center gap-3 font-semibold">
                        <input
                          aria-label={`${formatDate(entry.date)}を出力対象にする`}
                          className="h-4 w-4 rounded border-slate-300 text-blue-700"
                          checked={entry.selected}
                          type="checkbox"
                          onChange={() => toggleCommuteEntry(entry.id)}
                        />
                        {formatDate(entry.date)}
                      </label>
                      <span className="font-semibold tabular-nums">
                        {formatYen(entry.roundTripFare)}
                      </span>
                    </div>
                    <div className="pt-4">
                      <RouteEditor
                        entry={entry}
                        inputId={`mobile-route-${entry.id}`}
                        onChange={setCommuteEntryRoute}
                      />
                      <FareBreakdown
                        entry={entry}
                        onToggle={toggleCommuteFareItem}
                      />
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-5 hidden overflow-x-auto rounded-xl border border-slate-300 sm:block">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead className="bg-slate-100/70 text-left text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="w-20 px-4 py-3">対象</th>
                      <th className="w-36 px-4 py-3">日付</th>
                      <th className="px-4 py-3">通勤経路</th>
                      <th className="w-32 px-4 py-3 text-right">往復交通費</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-300">
                    {commuteEntries.map((entry) => (
                      <tr
                        className={
                          entry.selected
                            ? "odd:bg-white even:bg-slate-50/80"
                            : "bg-slate-100 text-slate-500"
                        }
                        key={entry.id}
                      >
                        <td className="px-4 py-3">
                          <input
                            aria-label={`${formatDate(entry.date)}を出力対象にする`}
                            className="h-4 w-4 rounded border-slate-300 text-blue-700"
                            checked={entry.selected}
                            type="checkbox"
                            onChange={() => toggleCommuteEntry(entry.id)}
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-4 py-3">
                          <RouteEditor
                            entry={entry}
                            inputId={`desktop-route-${entry.id}`}
                            onChange={setCommuteEntryRoute}
                          />
                          <FareBreakdown
                            entry={entry}
                            onToggle={toggleCommuteFareItem}
                          />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatYen(entry.roundTripFare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <StepFooter
              message={
                selectedCount === 0
                  ? "出力する日を選択してください。"
                  : `${selectedCount}日分を確認しました。経路が空欄の日は、ステップ3でテンプレートから補完できます。`
              }
              buttonLabel="勤務先・社員情報の入力へ"
              disabled={selectedCount === 0}
              onNext={() => advanceTo(3)}
            />
          </div>
        </Step>

        <Step
          active={activeStep === 3}
          available={furthestStep >= 3 && selectedCount > 0}
          completed={furthestStep > 3}
          number={3}
          summary={
            furthestStep > 3
              ? `勤務先 ${configuredDateCount}/${selectedCount}日を設定`
              : undefined
          }
          title="勤務先・社員情報を入力する"
          onOpen={() => setActiveStep(3)}
        >
          <div className="space-y-10">
            <section aria-labelledby="route-information-heading">
              <div>
                <h3 className="text-lg font-semibold" id="route-information-heading">勤務先情報</h3>
                <p className="mt-1 text-sm text-slate-600">
                  日付ごとに勤務先テンプレートを選択し、経路・料金・勤務先情報を確認できます。空欄の経路や料金はテンプレートから補完されます。
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  横にスクロールして勤務先情報を確認できます。今回の編集は登録済み勤務先テンプレート本体を変更しません。
                </p>
              </div>

              {selectedEntries.length > 0 ? (
                <div className="relative isolate mt-5 overflow-x-auto rounded-xl border border-slate-300">
                  <table className={hasSelectedCompanyData ? "w-full min-w-[1740px] border-collapse text-sm" : "w-full min-w-[980px] border-collapse text-sm"}>
                    <thead className="bg-slate-100/70 text-left text-xs font-semibold text-slate-600">
                      <tr>
                        <th className="sticky left-0 z-20 w-32 min-w-32 bg-slate-100/95 px-4 py-3">日付</th>
                        <th className="w-[34rem] min-w-[34rem] px-4 py-3">通勤経路</th>
                        <th className="w-[18rem] min-w-[18rem] px-4 py-3">勤務先テンプレート</th>
                        <th className="w-36 min-w-36 px-4 py-3">1日往復料金</th>
                        {hasSelectedCompanyData ? (
                          <>
                            <th className="w-56 min-w-56 px-4 py-3">会社名</th>
                            <th className="w-56 min-w-56 px-4 py-3">勤務場所</th>
                            <th className="w-36 min-w-36 px-4 py-3">勤務開始</th>
                            <th className="w-36 min-w-36 px-4 py-3">勤務終了</th>
                          </>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {selectedEntries.map((entry) => (
                        <tr className="odd:bg-white even:bg-slate-50/60" key={entry.id}>
                          <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-4 align-top font-medium text-slate-800">
                            {formatDate(entry.date)}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex min-w-0 items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <RouteEditor
                                  entry={entry}
                                  inputId={`company-route-${entry.id}`}
                                  onChange={setCommuteEntryRoute}
                                />
                              </div>
                              <button
                                className="mt-0.5 inline-flex h-10 flex-none items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                                type="button"
                                onClick={() => onOpenCompanyData({
                                  companyName: entry.companyName,
                                  workLocation: entry.workLocation,
                                  commuteRoute: entry.route,
                                  startTime: entry.startTime,
                                  endTime: entry.endTime,
                                  roundTripFare: entry.roundTripFare,
                                })}
                              >
                                テンプレート作成
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <select
                              aria-label={`${formatDate(entry.date)}の勤務先テンプレート`}
                              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-blue-600"
                              value={entry.companyDataId ?? ""}
                              onChange={(event) => {
                                if (event.target.value) {
                                  applyCompanyDataToEntry(entry.id, event.target.value);
                                } else {
                                  clearCompanyDataSelectionForEntry(entry.id);
                                }
                              }}
                            >
                              <option value="">選択しない（空欄で出力）</option>
                              {companyData.map((record) => (
                                <option key={record.id} value={record.id}>
                                  {record.companyName}
                                  {record.workLocation ? ` / ${record.workLocation}` : ""}
                                  {record.roundTripFare != null ? ` / ${formatYen(record.roundTripFare)}` : ""}
                                  （{record.commuteRoute}）
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <label className="grid gap-2 text-xs font-semibold text-slate-600" htmlFor={`company-fare-${entry.id}`}>
                              <span className="sr-only">料金（円）</span>
                              <input
                                id={`company-fare-${entry.id}`}
                                aria-label={`${formatDate(entry.date)}の1日往復料金`}
                                className="h-10 w-32 rounded-md border border-slate-300 bg-white px-3 text-right text-sm font-normal text-slate-950 outline-none focus:border-blue-600"
                                min={0}
                                step={1}
                                type="number"
                                value={entry.roundTripFare}
                                onChange={(event) => setCommuteEntryFare(entry.id, Number(event.target.value))}
                              />
                            </label>
                            <p className="mt-2 text-xs text-slate-500">{formatYen(entry.roundTripFare)}</p>
                          </td>
                          {hasSelectedCompanyData ? (
                            entry.companyDataId ? (
                              <>
                                <td className="px-4 py-3 align-top">
                                  <CompactTextField
                                    label={`${formatDate(entry.date)}の会社名`}
                                    value={entry.companyName}
                                    onChange={(value) => setCommuteEntryField(entry.id, "companyName", value)}
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <CompactTextField
                                    label={`${formatDate(entry.date)}の勤務場所`}
                                    value={entry.workLocation}
                                    onChange={(value) => setCommuteEntryField(entry.id, "workLocation", value)}
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <CompactTextField
                                    label={`${formatDate(entry.date)}の勤務開始`}
                                    type="time"
                                    value={entry.startTime}
                                    onChange={(value) => setCommuteEntryField(entry.id, "startTime", value)}
                                  />
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <CompactTextField
                                    label={`${formatDate(entry.date)}の勤務終了`}
                                    type="time"
                                    value={entry.endTime}
                                    onChange={(value) => setCommuteEntryField(entry.id, "endTime", value)}
                                  />
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-4 align-top text-center text-slate-400">—</td>
                                <td className="px-4 py-4 align-top text-center text-slate-400">—</td>
                                <td className="px-4 py-4 align-top text-center text-slate-400">—</td>
                                <td className="px-4 py-4 align-top text-center text-slate-400">—</td>
                              </>
                            )
                          ) : null}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {missingInputCount > 0 ? (
                <p className="mt-4 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                  出力対象の{missingInputCount}日分は、勤務先テンプレート未選択のため会社名・勤務場所・勤務時間が空欄で出力されます。
                </p>
              ) : null}
            </section>

            <section aria-labelledby="employee-information-heading">
              <h3 className="text-lg font-semibold" id="employee-information-heading">出力用の社員情報</h3>
              <p className="mt-1 text-sm text-slate-600">
                交通費請求書に記載する支社、社員ID、氏名を入力します。同じブラウザでは次回も使用できます。
              </p>
              <div className="mt-5 grid gap-4 rounded-xl bg-slate-100/70 p-5 sm:p-6 md:grid-cols-3">
                <TextField label="支社" value={settings.branch} onChange={(value) => setSetting("branch", value)} />
                <TextField label="社員ID" value={settings.employeeId} onChange={(value) => setSetting("employeeId", value)} />
                <TextField label="氏名" value={settings.name} onChange={(value) => setSetting("name", value)} />
              </div>
            </section>

            <StepFooter
              message={`${selectedCount}日分の勤務先・社員情報を確認してください。`}
              buttonLabel="Excelの作成・保存へ"
              onNext={() => advanceTo(4)}
            />
          </div>
        </Step>

        <Step
          active={activeStep === 4}
          available={furthestStep >= 4 && selectedCount > 0}
          completed={generated.length > 0}
          number={4}
          summary={generated.length > 0 ? "Excelを作成しました" : undefined}
          title="Excelを作成・保存する"
          onOpen={() => setActiveStep(4)}
        >
          <div className="space-y-8">
            <section aria-labelledby="excel-template-heading">
              <h3 className="text-lg font-semibold" id="excel-template-heading">使用するExcelテンプレート</h3>
              <p className="mt-1 text-sm text-slate-600">
                通常は最初から用意されているサンエスExcelテンプレートを使用します。
              </p>
              <div className="mt-5 flex flex-col gap-4 rounded-xl bg-slate-100/70 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
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
            </section>

            {missingInputCount > 0 ? (
              <InlineMessage tone="warning">
                勤務先テンプレート未選択の日が{missingInputCount}日あります。勤務先情報は空欄で出力されます。
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
                {status === "generating" ? "Excelを作成中" : "交通費請求書Excelを作成・保存"}
              </button>
              {status === "error" && activeStep === 4 ? (
                <div className="mt-4"><InlineMessage tone="error">{message}</InlineMessage></div>
              ) : null}
            </div>

            {generated.length > 0 ? (
              <section className="border-t border-blue-200 pt-7" aria-labelledby="generated-heading">
                <p className="text-sm font-semibold text-blue-700">作成完了</p>
                <h3 className="mt-1 text-xl font-semibold" id="generated-heading">Excelを保存できます</h3>
                <p className="mt-2 text-sm text-slate-600">
                  {formatReportDate(reportDate)}・{selectedCount}日分の交通費請求書を作成しました。
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  A4横・1ページで印刷できるように設定済みです。印刷前にプレビューが1ページになっていることを確認してください。
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
                      {workbook.fileName}をもう一度保存
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
  persistentContent,
  onOpen,
  children,
}: {
  number: WorkflowStep;
  title: string;
  summary?: string;
  active: boolean;
  completed: boolean;
  available: boolean;
  persistentContent?: ReactNode;
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
      {persistentContent ? (
        <div className="mt-4 pl-0 sm:pl-13">{persistentContent}</div>
      ) : null}
      {active ? (
        <div className={persistentContent ? "mt-5 pl-0 sm:pl-13" : "mt-7 pl-0 sm:pl-13"}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

function StepFooter({
  message,
  buttonLabel,
  disabled = false,
  onNext,
}: {
  message: string;
  buttonLabel: string;
  disabled?: boolean;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">{message}</p>
      <button
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={disabled}
        type="button"
        onClick={onNext}
      >
        {buttonLabel}
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
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
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: "text" | "time";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none focus:border-blue-600"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CompactTextField({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: "text" | "time";
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RouteEditor({
  entry,
  inputId,
  onChange,
}: {
  entry: CommuteEntry;
  inputId: string;
  onChange: (id: string, route: string) => void;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-xs font-semibold text-slate-600 sm:sr-only"
        htmlFor={inputId}
      >
        通勤経路
      </label>
      <textarea
        id={inputId}
        aria-label={`${formatDate(entry.date)}の通勤経路`}
        className="min-h-20 w-full min-w-0 resize-y rounded-md border border-slate-300 bg-white px-3 py-2 leading-6 text-slate-950 outline-none focus:border-blue-600 sm:min-h-16 sm:min-w-72"
        rows={2}
        value={entry.route}
        onChange={(event) => onChange(entry.id, event.target.value)}
      />
      {entry.fareItems?.some((item) => item.kind === "bus") ? (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          バスの乗降停留所はPDFにないため、空欄のまま進めるか、テンプレートから補完できます。
        </p>
      ) : null}
    </div>
  );
}

function FareBreakdown({
  entry,
  onToggle,
}: {
  entry: CommuteEntry;
  onToggle: (entryId: string, itemId: string) => void;
}) {
  const fareItems = entry.fareItems ?? [];
  if (fareItems.length === 0) {
    return null;
  }

  const selectedItemCount = fareItems.reduce(
    (count, item) => count + (item.selected ? 1 : 0),
    0,
  );

  return (
    <details open className="group mt-3 rounded-lg border border-slate-200 bg-slate-50/70 text-slate-700">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        <span>
          運賃内訳
          <span className="ml-2 font-normal text-slate-500">
            {selectedItemCount}/{fareItems.length}件
          </span>
        </span>
        <ChevronDown className="h-4 w-4 flex-none transition-transform group-open:rotate-180" />
      </summary>
      <div className="border-t border-slate-200 px-3 py-3">
        <p className="mb-3 text-xs leading-5 text-slate-500">
          チェックした利用分の合計が往復交通費に反映されます。
        </p>
        <div className="grid gap-2">
          {fareItems.map((item) => (
            <label
              className={
                item.selected
                  ? "grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-2 rounded-md bg-white px-3 py-2 text-sm"
                  : "grid cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-400"
              }
              key={item.id}
            >
              <input
                aria-label={`${formatDate(entry.date)}の${item.label}を交通費に含める`}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700"
                checked={item.selected}
                type="checkbox"
                onChange={() => onToggle(entry.id, item.id)}
              />
              <span
                className={
                  item.kind === "bus"
                    ? "rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900"
                    : "rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-800"
                }
              >
                {item.kind === "bus" ? "バス" : "鉄道"}
              </span>
              <span className="min-w-0 leading-5">{item.label}</span>
              <span className="whitespace-nowrap font-medium tabular-nums">
                {formatYen(item.amount)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </details>
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
