import { ArrowLeft, Building2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAppStore } from "../store/useAppStore";
import type { CompanyData, CompanyDataInput } from "../types";

const emptyInput: CompanyDataInput = {
  companyName: "",
  workLocation: "",
  commuteRoute: "",
  startTime: "",
  endTime: "",
  roundTripFare: null,
};

export function CompanyDataPage({
  initialInput,
  onBackToMain,
}: {
  initialInput?: CompanyDataInput;
  onBackToMain: () => void;
}) {
  const { companyData, saveCompanyDataEntry, deleteCompanyDataEntry } = useAppStore();
  const [input, setInput] = useState<CompanyDataInput>(initialInput ?? emptyInput);
  const [editingId, setEditingId] = useState<string>();
  const [message, setMessage] = useState(
    initialInput?.commuteRoute
      ? "選択中の通勤経路を引き継ぎました。勤務先情報を確認して登録してください。"
      : "",
  );

  function updateField(
    key: keyof CompanyDataInput,
    value: string | number | null,
  ) {
    setInput((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.companyName.trim() || !input.commuteRoute.trim()) {
      setMessage("会社名と通勤経路を入力してください。");
      return;
    }

    saveCompanyDataEntry(input, editingId);
    setMessage(editingId ? "勤務先テンプレートを更新しました。" : "勤務先テンプレートを登録しました。");
    setEditingId(undefined);
    setInput(emptyInput);
  }

  function startEditing(record: CompanyData) {
    setEditingId(record.id);
    setInput({
      companyName: record.companyName,
      workLocation: record.workLocation,
      commuteRoute: record.commuteRoute,
      startTime: record.startTime,
      endTime: record.endTime,
      roundTripFare: record.roundTripFare ?? null,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(undefined);
    setInput(emptyInput);
    setMessage("");
  }

  function deleteRecord(record: CompanyData) {
    deleteCompanyDataEntry(record.id);
    if (editingId === record.id) {
      cancelEditing();
    }
    setMessage(`${record.companyName}の勤務先テンプレートを削除しました。`);
  }

  return (
    <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-700" />
            <h2 className="text-2xl font-semibold tracking-tight">勤務先テンプレート</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            申請時に繰り返し使う会社名、勤務場所、通勤経路、1日往復料金、勤務時刻を登録します。
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 self-start rounded-md px-3 text-sm font-medium text-blue-700 hover:bg-blue-50 sm:self-auto"
          type="button"
          onClick={onBackToMain}
        >
          <ArrowLeft className="h-4 w-4" />
          作成画面へ戻る
        </button>
      </div>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="company-form-heading">
        <div className="flex items-center gap-2">
          {editingId ? <Pencil className="h-5 w-5 text-blue-700" /> : <Plus className="h-5 w-5 text-blue-700" />}
          <h3 className="text-lg font-semibold" id="company-form-heading">
            {editingId ? "勤務先テンプレートを編集" : "勤務先テンプレートを登録"}
          </h3>
        </div>

        {message ? (
          <p className="mt-4 border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950" role="status">
            {message}
          </p>
        ) : null}

        <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <CompanyField
              label="会社名"
              required
              value={input.companyName}
              onChange={(value) => updateField("companyName", value)}
            />
            <CompanyField
              label="勤務場所"
              value={input.workLocation}
              onChange={(value) => updateField("workLocation", value)}
            />
          </div>
          <CompanyField
            label="通勤経路"
            required
            value={input.commuteRoute}
            placeholder="例：幕張本郷駅 ～ 千葉駅"
            onChange={(value) => updateField("commuteRoute", value)}
          />
          <CompanyField
            label="1日往復料金（円）"
            type="number"
            min={0}
            value={input.roundTripFare == null ? "" : String(input.roundTripFare)}
            onChange={(value) => updateField("roundTripFare", value === "" ? null : Number(value))}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <CompanyField
              label="勤務開始時刻"
              type="time"
              value={input.startTime}
              onChange={(value) => updateField("startTime", value)}
            />
            <CompanyField
              label="勤務終了時刻"
              type="time"
              value={input.endTime}
              onChange={(value) => updateField("endTime", value)}
            />
          </div>
          <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
            <button
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-600"
              type="submit"
            >
              <Save className="h-4 w-4" />
              {editingId ? "更新する" : "登録する"}
            </button>
            {editingId ? (
              <button
                className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-100"
                type="button"
                onClick={cancelEditing}
              >
                <X className="h-4 w-4" />
                編集をやめる
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="mt-10" aria-labelledby="company-list-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold" id="company-list-heading">登録済み勤務先テンプレート</h3>
            <p className="mt-1 text-sm text-slate-600">{companyData.length}件登録されています。</p>
          </div>
        </div>

        {companyData.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-12 text-center text-sm text-slate-600">
            登録済みの勤務先テンプレートはありません。
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {companyData.map((record) => (
              <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={record.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-semibold text-slate-900">{record.companyName}</h4>
                    <p className="mt-1 text-sm text-slate-600">{record.workLocation}</p>
                  </div>
                  <div className="flex flex-none gap-1">
                    <button
                      aria-label={`${record.companyName}を編集`}
                      className="rounded-md p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      type="button"
                      onClick={() => startEditing(record)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label={`${record.companyName}を削除`}
                      className="rounded-md p-2 text-slate-600 hover:bg-red-50 hover:text-red-700"
                      type="button"
                      onClick={() => deleteRecord(record)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <dl className="mt-5 grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-slate-500">通勤経路</dt>
                    <dd className="mt-1 text-slate-800">{record.commuteRoute}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">1日往復料金</dt>
                    <dd className="mt-1 text-slate-800">
                      {record.roundTripFare == null ? "未設定" : formatYen(record.roundTripFare)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">勤務開始</dt>
                    <dd className="mt-1 text-slate-800">{record.startTime || "未設定"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-slate-500">勤務終了</dt>
                    <dd className="mt-1 text-slate-800">{record.endTime || "未設定"}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CompanyField({
  label,
  value,
  type = "text",
  min,
  placeholder,
  required = false,
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "time" | "number";
  min?: number;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}{required ? <span className="ml-1 text-red-600">必須</span> : null}</span>
      <input
        className="h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal text-slate-950 outline-none focus:border-blue-600"
        placeholder={placeholder}
        required={required}
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function formatYen(value: number): string {
  return `${value.toLocaleString("ja-JP")}円`;
}
