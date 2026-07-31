# サンエス警備用 交通費請求書作成ツール

モバイルSuicaの利用履歴PDFから通勤日・経路・運賃を読み取り、サンエス警備の「勤務表及び交通費請求書」Excelを作成するブラウザアプリです。

公開版: [https://opvelll.github.io/koutuhi/](https://opvelll.github.io/koutuhi/)

## ファイルの取り扱い

選択したPDFとExcelテンプレートは、すべて端末のブラウザ内で処理します。サーバー、外部API、外部OCRサービス、CDNへファイルを送信しません。

社員情報や勤務先情報、PDFから作成した編集中データは、同じ端末・同じブラウザの保存領域に記録されます。別の端末やブラウザには引き継がれません。

## 使い方

1. `Suica利用履歴PDFを選ぶ` で、モバイルSuicaの「SF（電子マネー）利用履歴」から保存したPDFを選択します。
2. `通勤履歴を確認する` で、Excelへ出力する日と、日付・経路・往復交通費を確認します。
3. `勤務先・社員情報を入力する` で、勤務先テンプレート、支社、社員ID、氏名を入力します。
4. `Excelを作成・保存する` で、サンエスExcelテンプレートを使ったXLSXを作成して保存します。

通常は同梱のサンエスExcelテンプレートを使用するため、別のExcelファイルを用意する必要はありません。勤務先テンプレートを選択しない経路は、会社名・勤務場所・勤務時間が空欄で出力されます。

詳しい手順は、公開版上部の `使い方` から確認できます。

## Suica利用履歴PDFの保存方法

1. [モバイルSuica](https://www.mobilesuica.com/index.aspx) にログインします。
2. `SF（電子マネー）利用履歴` を開きます。
3. 対象の履歴を選び、`選択した履歴を印刷` からPDFとして保存します。

文字を選択できるPDFを使用してください。画像として保存されたPDFは読み込めません。

## ローカル開発

```powershell
pnpm install
pnpm dev:web
```

ViteのGitHub Pages用baseは `/koutuhi/` です。開発サーバーでは表示されたURL、または `http://127.0.0.1:5173/koutuhi/` を開いてください。

検証:

```powershell
pnpm test:web
pnpm build:web
```

## GitHub Pages公開

`master` へのpush、または手動実行で `.github/workflows/deploy-pages.yml` が `web/` をビルドし、`web/dist` をGitHub Pagesへ公開します。

## 注意

このツールは請求書作成の補助です。抽出結果と生成されたExcelは、提出前に必ず確認してください。
