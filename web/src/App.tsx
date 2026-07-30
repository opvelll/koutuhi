import { BookOpen, Building2, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";

import { CompanyDataPage } from "./pages/CompanyDataPage";
import { GuidePage } from "./pages/GuidePage";
import { MainToolPage } from "./pages/MainToolPage";
import type { CompanyDataInput } from "./types";

type Page = "main" | "company" | "guide";

export default function App() {
  const [page, setPage] = useState<Page>("main");
  const [companyDataInitialInput, setCompanyDataInitialInput] = useState<CompanyDataInput>();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  function openCompanyData(initialInput?: CompanyDataInput) {
    setCompanyDataInitialInput(initialInput);
    setPage("company");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50/95">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-blue-700" />
            <h1 className="text-xl font-semibold tracking-tight">交通費請求書作成ツール</h1>
          </div>

          <nav aria-label="ページ切り替え" className="flex gap-2 sm:gap-6">
            <PageButton
              active={page === "main"}
              icon={<FileSpreadsheet className="h-4 w-4" />}
              label="作成"
              onClick={() => setPage("main")}
            />
            <PageButton
              active={page === "company"}
              icon={<Building2 className="h-4 w-4" />}
              label="勤務先テンプレート"
              onClick={() => openCompanyData()}
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

      <div hidden={page !== "main"}>
        <MainToolPage onOpenCompanyData={openCompanyData} />
      </div>
      {page === "company" ? (
        <CompanyDataPage
          initialInput={companyDataInitialInput}
          onBackToMain={() => setPage("main")}
        />
      ) : page === "guide" ? (
        <GuidePage onOpenMain={() => setPage("main")} />
      ) : null}
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
          ? "flex h-9 items-center gap-2 border-b-2 border-blue-700 text-sm font-semibold text-blue-800"
          : "flex h-9 items-center gap-2 border-b-2 border-transparent text-sm font-medium text-slate-600 hover:text-blue-700"
      }
      type="button"
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}
