import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Printer,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

const suicaGuideScreenshots = [
  {
    alt: "モバイルSuica会員メニューサイトのログイン画面",
    caption: "モバイルSuicaのID、またはJRE IDを選んでログインします。",
    fileName: "スクリーンショット 2026-07-14 213455.png",
    title: "会員メニューへログイン",
  },
  {
    alt: "モバイルSuica会員メニューにあるSF電子マネー利用履歴の選択画面",
    caption: "会員メニューの「SF（電子マネー）利用履歴」を選びます。",
    fileName: "スクリーンショット 2026-07-14 214015-2.png",
    title: "SF（電子マネー）利用履歴を開く",
  },
  {
    alt: "モバイルSuicaのSF電子マネー利用履歴ページと選択した履歴を印刷ボタン",
    caption: "期間と履歴を選択し、右側の「選択した履歴を印刷」からPDFとして保存します。",
    fileName: "スクリーンショット 2026-07-14 222746.png",
    title: "選択した履歴をPDFとして保存",
  },
] as const;

export function GuidePage({ onOpenMain }: { onOpenMain: () => void }) {
  return (
    <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12">
      <section className="border-b border-slate-200 bg-blue-50 px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-blue-700">はじめての方へ</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          交通費請求書の作り方
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Suica利用履歴PDFの準備から、内容確認、Excelのダウンロードまでを順番に説明します。
          PDFとExcelはブラウザ内で処理されます。
        </p>
        <button
          className="mt-6 flex h-11 items-center gap-2 rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-600"
          type="button"
          onClick={onOpenMain}
        >
          作成画面を開く
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <GuideSection
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="最初に用意するもの"
      >
        <ul className="space-y-3 text-sm leading-7 text-slate-700">
          <li>・モバイルSuicaから保存した「SF（電子マネー）利用履歴」のPDF</li>
          <li>・Excelへ記載する支社、社員ID、氏名</li>
          <li>・各通勤経路に対応する会社名と勤務場所</li>
        </ul>
        <div className="mt-5 border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
          サンエスExcelテンプレートは最初から用意されています。通常はExcelファイルを別途準備する必要はありません。
        </div>
      </GuideSection>

      <GuideSection icon={<FileText className="h-5 w-5" />} title="Suica利用履歴PDFを保存する">
        <div className="space-y-6">
          {suicaGuideScreenshots.map((screenshot, index) => (
            <ScreenshotStep
              key={screenshot.fileName}
              alt={screenshot.alt}
              caption={screenshot.caption}
              fileName={screenshot.fileName}
              step={index + 1}
              title={screenshot.title}
            />
          ))}
        </div>
        <p className="mt-5 border-l-2 border-slate-300 pl-4 text-xs leading-6 text-slate-600">
          モバイルSuica側の画面やボタン名は、サービスの更新によって変わる場合があります。
        </p>
        <a
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline"
          href="https://www.mobilesuica.com/index.aspx"
          rel="noreferrer"
          target="_blank"
        >
          モバイルSuicaを開く
          <ExternalLink className="h-4 w-4" />
        </a>
      </GuideSection>

      <GuideSection icon={<FileText className="h-5 w-5" />} title="ステップ1：PDFを読み込む">
        <p className="text-sm leading-7 text-slate-700">
          「Suica利用履歴PDFを選択」ボタンから保存したPDFを選びます。読み込みが完了すると、対象年月と通勤日が表示され、内容確認へ進みます。
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          PDFに含まれる文字をブラウザ内で直接読み取ります。画像として保存されたPDFは読み込めません。
        </p>
      </GuideSection>

      <GuideSection icon={<CheckCircle2 className="h-5 w-5" />} title="ステップ2：通勤履歴を確認する">
        <NumberedList
          items={[
            "交通費請求に含める日だけ、選択欄をオンにします。",
            "日付、通勤経路、往復交通費が正しいか確認します。",
            "経路ごとの入力情報で会社名と勤務場所を入力します。入力内容は通勤経路ごとに自動保存されます。",
          ]}
        />
        <p className="mt-5 border-l-2 border-slate-300 pl-4 text-sm leading-6 text-slate-700">
          同じ通勤経路を次回読み込むと、保存済みの会社名と勤務場所が自動で入ります。不要になった保存値は「保存した入力情報を管理」から削除できます。
        </p>
      </GuideSection>

      <GuideSection icon={<FileSpreadsheet className="h-5 w-5" />} title="ステップ3：Excelを作成する">
        <NumberedList
          items={[
            "支社、社員ID、氏名を確認します。これらはブラウザに保存されます。",
            "現在のExcelテンプレートを確認します。通常は既定のサンエステンプレートを使用します。",
            "未入力の注意が表示されている場合は内容を確認し、「交通費請求書Excelを作成」を押します。",
            "作成後に表示されるダウンロードボタンからExcelを保存します。",
          ]}
        />
        <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          会社名または勤務場所が空欄でもExcelは作成できますが、該当欄は空欄になります。
        </div>
      </GuideSection>

      <GuideSection icon={<Printer className="h-5 w-5" />} title="作成後：印刷・提出する">
        <NumberedList
          items={[
            "ダウンロードしたExcelを開き、日付、経路、金額、会社名、勤務場所に間違いがないか確認します。",
            "作成した交通費請求書Excelと、ステップ1で使用したSuica利用履歴PDFを印刷します。",
            "必要書類と提出先を所属支社に確認し、案内された方法で提出します。",
          ]}
        />
        <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          支社によっては、印刷する書類や提出方法が異なる場合があります。この手順を標準的な流れとして参考にし、提出前に所属支社の案内を確認してください。
        </div>
      </GuideSection>

      <GuideSection icon={<ShieldCheck className="h-5 w-5" />} title="ファイルと保存データについて">
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            選択したPDFとExcelテンプレートは、このブラウザ内だけで処理します。外部APIやCDNへファイルを送信しません。
          </p>
          <p>
            支社、社員ID、氏名、経路ごとの会社名と勤務場所は、このブラウザの保存領域に記録されます。別の端末や別のブラウザには引き継がれません。
          </p>
        </div>
      </GuideSection>

      <GuideSection icon={<HelpCircle className="h-5 w-5" />} title="よくある質問">
        <div className="space-y-3">
          <Faq question="PDFを読み込んでも履歴が表示されません">
            モバイルSuicaの「SF（電子マネー）利用履歴」から直接保存した、文字を選択できるPDFか確認してください。画像として保存されたPDFは読み込めません。
          </Faq>
          <Faq question="会社名や勤務場所が自動で入るのはなぜですか">
            前回入力した内容を通勤経路ごとに保存しているためです。ステップ2の削除操作から保存値を消せます。
          </Faq>
          <Faq question="別のExcelテンプレートを使えますか">
            ステップ3の「Excelテンプレートを変更」からXLSXファイルを選択できます。テンプレートのシート構成が異なる場合は正しく出力できないことがあります。
          </Faq>
          <Faq question="未入力の項目があっても作成できますか">
            作成できます。ただし、会社名または勤務場所の未入力欄は空欄で出力されるため、ダウンロード後に必ず確認してください。
          </Faq>
          <Faq question="ファイルはインターネットへ送信されますか">
            送信されません。PDFの解析とExcel作成はブラウザ内で行います。
          </Faq>
        </div>
      </GuideSection>

      <section className="border-t border-amber-300 bg-amber-50 px-5 py-7 sm:px-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-800" />
          <div>
            <h2 className="font-semibold text-amber-950">提出前に必ず確認してください</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              このツールは請求書作成を補助するものです。日付、経路、金額、会社名、勤務場所と、生成されたExcelの内容を提出前に確認してください。必要書類と提出方法は所属支社へ確認してください。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScreenshotStep({
  step,
  title,
  caption,
  fileName,
  alt,
}: {
  step: number;
  title: string;
  caption: string;
  fileName: string;
  alt: string;
}) {
  return (
    <figure>
      <figcaption className="flex items-start gap-3 pb-4">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
          {step}
        </span>
        <span>
          <span className="block font-semibold text-slate-950">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-slate-600">{caption}</span>
        </span>
      </figcaption>
      <div className="bg-slate-100 p-2 sm:p-4">
        <img
          alt={alt}
          className="mx-auto h-auto w-full bg-white object-contain"
          loading="lazy"
          src={`${import.meta.env.BASE_URL}doc/${fileName}`}
        />
      </div>
    </figure>
  );
}

function GuideSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-slate-200 px-1 py-8 sm:px-5 sm:py-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          {icon}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="space-y-4">
      {items.map((item, index) => (
        <li className="flex items-start gap-3 text-sm leading-7 text-slate-700" key={item}>
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-800">
            {index + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function Faq({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group border-b border-slate-200 px-1 py-3">
      <summary className="cursor-pointer font-medium text-slate-900">{question}</summary>
      <p className="mt-3 pl-4 text-sm leading-7 text-slate-700">
        {children}
      </p>
    </details>
  );
}
