import {
  AlertTriangle,
  ArrowRight,
  Building2,
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
    caption: "期間と履歴を選び、右側の「選択した履歴を印刷」からPDFとして保存します。",
    fileName: "スクリーンショット 2026-07-14 222746.png",
    title: "選択した履歴をPDFとして保存",
  },
] as const;

const workflowSteps = [
  {
    description: "モバイルSuicaから保存した利用履歴PDFを選びます。",
    icon: <FileText className="h-5 w-5" />,
    number: 1,
    title: "Suica利用履歴PDFを選ぶ",
  },
  {
    description: "出力する日と、日付・経路・往復交通費を確認します。",
    icon: <CheckCircle2 className="h-5 w-5" />,
    number: 2,
    title: "通勤履歴を確認する",
  },
  {
    description: "勤務先テンプレートと、支社・社員ID・氏名を入力します。",
    icon: <Building2 className="h-5 w-5" />,
    number: 3,
    title: "勤務先・社員情報を入力する",
  },
  {
    description: "交通費請求書Excelを作成し、端末へ保存します。",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    number: 4,
    title: "Excelを作成・保存する",
  },
] as const;

const termDefinitions = [
  ["PDF", "印刷した書類と同じ見た目で、文書を保存できるファイルです。"],
  ["ブラウザ", "ChromeやEdgeなど、Webページを見るためのアプリです。"],
  ["SF（電子マネー）利用履歴", "Suicaを使った日、駅名、運賃などが並んだ記録です。"],
  ["Excelテンプレート", "交通費請求書の書式があらかじめ入った、ひな形ファイルです。"],
  ["勤務先テンプレート", "会社名、勤務場所、勤務時間、通勤経路をまとめて再利用する設定です。"],
  ["ダウンロード", "作成したファイルを、この端末へ保存することです。"],
] as const;

export function GuidePage({ onOpenMain }: { onOpenMain: () => void }) {
  return (
    <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 sm:py-12">
      <section className="border-b border-slate-200 bg-blue-50 px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold text-blue-700">はじめての方へ</p>
        <h2 className="mt-2 max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
          Suicaの利用履歴から、サンエス警備用の交通費請求書Excelを作ります
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700">
          モバイルSuicaから利用履歴のPDFを保存し、このツールで内容を確認すると、提出用Excelを作成できます。順番どおりに進めれば完了します。
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

      <section className="border-b border-emerald-200 bg-emerald-50 px-5 py-7 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-emerald-950">選んだファイルは、どこにも送信しません</h2>
            <p className="mt-2 text-sm leading-7 text-emerald-950">
              SuicaのPDFも、作成に使うExcelも、この端末のブラウザ内だけで処理します。インターネット上のサーバーや外部サービスへファイルを送信することはありません。
            </p>
          </div>
        </div>
      </section>

      <GuideSection icon={<HelpCircle className="h-5 w-5" />} title="最初に知っておく言葉">
        <p className="mb-5 text-sm leading-7 text-slate-700">
          このページで使う言葉を、先にかんたんに説明します。
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          {termDefinitions.map(([term, definition]) => (
            <TermDefinition definition={definition} key={term} term={term} />
          ))}
        </dl>
      </GuideSection>

      <GuideSection icon={<CheckCircle2 className="h-5 w-5" />} title="作成は4ステップです">
        <div className="grid gap-4 sm:grid-cols-2">
          {workflowSteps.map((step) => (
            <WorkflowCard key={step.number} {...step} />
          ))}
        </div>
      </GuideSection>

      <GuideSection icon={<CheckCircle2 className="h-5 w-5" />} title="最初に用意するもの">
        <ul className="space-y-3 text-sm leading-7 text-slate-700">
          <li>・モバイルSuicaから保存した「SF（電子マネー）利用履歴」のPDF</li>
          <li>・交通費請求書に記載する支社、社員ID、氏名</li>
          <li>・勤務先の会社名、勤務場所、勤務時間</li>
        </ul>
        <div className="mt-5 border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-950">
          サンエス警備用のExcelテンプレートは最初から用意されています。通常はExcelファイルを別に準備する必要はありません。
        </div>
      </GuideSection>

      <GuideSection icon={<FileText className="h-5 w-5" />} title="Suica利用履歴PDFを保存する">
        <p className="mb-6 text-sm leading-7 text-slate-700">
          はじめに、モバイルSuicaの会員メニューから利用履歴をPDFとして保存します。
        </p>
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

      <GuideSection icon={<FileText className="h-5 w-5" />} title="ステップ1：Suica利用履歴PDFを選ぶ">
        <NumberedList
          items={[
            "作成画面の「Suica利用履歴PDFを選択」を押します。",
            "先ほどモバイルSuicaから保存したPDFを選びます。",
            "読み込みが終わると、対象年月と通勤日が表示され、自動でステップ2へ進みます。",
          ]}
        />
        <p className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          PDFの文字をブラウザ内で読み取ります。紙を撮影したものなど、画像だけのPDFは読み込めません。
        </p>
      </GuideSection>

      <GuideSection icon={<CheckCircle2 className="h-5 w-5" />} title="ステップ2：通勤履歴を確認する">
        <NumberedList
          items={[
            "交通費請求書に含める日だけ、左側の選択欄をオンにします。",
            "日付、通勤経路、往復交通費に間違いがないか確認します。",
            "「勤務先・社員情報の入力へ」を押して、ステップ3へ進みます。",
          ]}
        />
        <p className="mt-5 border-l-2 border-slate-300 pl-4 text-sm leading-6 text-slate-700">
          出力する日が1日も選ばれていない場合は、次のステップへ進めません。
        </p>
      </GuideSection>

      <GuideSection icon={<Building2 className="h-5 w-5" />} title="ステップ3：勤務先・社員情報を入力する">
        <NumberedList
          items={[
            "通勤経路ごとに勤務先テンプレートを選びます。登録がなければ、その経路から新しく作成できます。",
            "必要に応じて、今回の会社名、勤務場所、勤務開始・終了時刻を直します。",
            "交通費請求書へ記載する支社、社員ID、氏名を入力します。",
            "「Excelの作成・保存へ」を押して、ステップ4へ進みます。",
          ]}
        />
        <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          勤務先テンプレートを選ばなくても作成できますが、その経路の会社名・勤務場所・勤務時間は空欄になります。
        </div>
      </GuideSection>

      <GuideSection icon={<FileSpreadsheet className="h-5 w-5" />} title="ステップ4：Excelを作成・保存する">
        <NumberedList
          items={[
            "使用するExcelテンプレートを確認します。通常は、最初から用意されたサンエスExcelテンプレートを使います。",
            "勤務先テンプレートが未選択という注意が出ていないか確認します。",
            "「交通費請求書Excelを作成・保存」を押します。",
            "作成されたExcelがこの端末へ保存されます。必要な場合は「もう一度保存」から再度保存できます。",
          ]}
        />
      </GuideSection>

      <GuideSection icon={<Printer className="h-5 w-5" />} title="作成後：確認・印刷・提出する">
        <NumberedList
          items={[
            "保存したExcelを開き、日付、経路、金額、会社名、勤務場所に間違いがないか確認します。",
            "交通費請求書Excelと、ステップ1で使ったSuica利用履歴PDFを印刷します。",
            "必要書類と提出先を所属支社に確認し、案内された方法で提出します。",
          ]}
        />
        <div className="mt-5 border-l-4 border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
          支社によって、印刷する書類や提出方法が異なる場合があります。提出前に所属支社の案内を確認してください。
        </div>
      </GuideSection>

      <GuideSection icon={<ShieldCheck className="h-5 w-5" />} title="入力した情報の保存について">
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            支社、社員ID、氏名、勤務先情報は、この端末のブラウザに保存されます。同じ端末・同じブラウザなら、次回も入力内容を使用できます。
          </p>
          <p>
            別の端末や別のブラウザには引き継がれません。共有端末を使う場合は、作業後に「編集中データをクリア」を押してください。
          </p>
        </div>
      </GuideSection>

      <GuideSection icon={<HelpCircle className="h-5 w-5" />} title="よくある質問">
        <div className="space-y-3">
          <Faq question="PDFを読み込んでも履歴が表示されません">
            モバイルSuicaの「SF（電子マネー）利用履歴」から直接保存した、文字を選べるPDFか確認してください。画像だけのPDFは読み込めません。
          </Faq>
          <Faq question="会社名や勤務場所が自動で入るのはなぜですか">
            選んだ勤務先テンプレートの内容を、同じ通勤経路の申請データへ反映しているためです。
          </Faq>
          <Faq question="別のExcelテンプレートを使えますか">
            ステップ4の「テンプレートを変更」からXLSXファイルを選べます。書式が異なるファイルでは、正しく出力できない場合があります。
          </Faq>
          <Faq question="勤務先テンプレートが未選択でも作成できますか">
            作成できます。ただし、未選択の経路は会社名・勤務場所・勤務時間が空欄になります。
          </Faq>
          <Faq question="ファイルはインターネットへ送信されますか">
            送信されません。PDFの読み取りとExcelの作成は、この端末のブラウザ内で行います。
          </Faq>
        </div>
      </GuideSection>

      <section className="border-t border-amber-300 bg-amber-50 px-5 py-7 sm:px-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-800" />
          <div>
            <h2 className="font-semibold text-amber-950">提出前に必ず確認してください</h2>
            <p className="mt-2 text-sm leading-6 text-amber-950">
              このツールは請求書作成を補助するものです。日付、経路、金額、会社名、勤務場所と、作成されたExcelの内容を提出前に確認してください。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkflowCard({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-800">
          {number}
        </span>
        <span className="text-blue-700">{icon}</span>
      </div>
      <h3 className="mt-4 font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

function TermDefinition({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="rounded-lg bg-slate-100/80 px-4 py-3">
      <dt className="text-sm font-semibold text-slate-900">{term}</dt>
      <dd className="mt-1 text-sm leading-6 text-slate-600">{definition}</dd>
    </div>
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
