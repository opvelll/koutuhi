import { BookOpen, FileSpreadsheet, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { GuidePage } from "./pages/GuidePage";
import { MainToolPage } from "./pages/MainToolPage";
import { useAppStore } from "./store/useAppStore";

type Page = "main" | "guide";

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const status = useAppStore((state) => state.status);
  const isBusy =
    status === "extracting" || status === "generating";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    交通費請求書作成ツール
                  </h1>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Suica利用履歴PDFを読み込み、勤務表及び交通費請求書Excelを作成します。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <StatusPill status={status} />
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            </div>
          </div>

          <nav aria-label="ページ切り替え" className="mt-5 flex gap-2 border-t border-slate-200 pt-4">
            <PageButton
              active={page === "main"}
              icon={<FileSpreadsheet className="h-4 w-4" />}
              label="メイン機能"
              onClick={() => setPage("main")}
            />
            <PageButton
              active={page === "guide"}
              icon={<BookOpen className="h-4 w-4" />}
              label="使い方"
              onClick={() => setPage("guide")}
            />
          </nav>
        </div>
      </header>

      {page === "main" ? (
        <MainToolPage />
      ) : (
        <GuidePage onOpenMain={() => setPage("main")} />
      )}
    </div>
  );
}

function PageButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "flex h-11 items-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white"
          : "flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
      }
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  const label =
    status === "idle"
      ? "待機"
      : status === "extracting"
        ? "PDF解析中"
        : status === "ready"
          ? "準備完了"
          : status === "generating"
            ? "Excel作成中"
            : "エラー";
  const tone =
    status === "ready"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "error"
        ? "bg-red-50 text-red-800 ring-red-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs ring-1 ${tone}`}>
      {label}
    </span>
  );
}
