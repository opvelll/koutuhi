# 交通費請求書作成支援ツール

Suicaの利用履歴PDFから交通経路と運賃を抽出し、サンエス警備の「勤務表及び交通費請求書」Excelへ転記するブラウザアプリです。

公開版: [https://opvelll.github.io/koutuhi/](https://opvelll.github.io/koutuhi/)

PDFとExcelテンプレートはブラウザ内で処理します。PDFを外部API、外部OCRサービス、CDNへ送信しません。

## 使い方

1. `PDF読込` でSuicaの利用履歴PDFを選択する。
2. `内容確認・入力` で抽出結果を確認し、請求対象と勤務先テンプレートを選択する。
3. `Excel出力` でサンエスExcelテンプレートを使ったXLSXをダウンロードする。

会社名と勤務場所は経路ごとに保存されます。同じ通勤経路を次回読み込んだときは、保存済みの入力値が再利用されます。

上部の `勤務先テンプレート` では、会社名、勤務場所、通勤経路、勤務開始・終了時刻を登録できます。作成画面でテンプレートを選ぶと、対象経路の日別申請データへ反映されます。
勤務先テンプレートを選択しない経路は、会社名、勤務場所、勤務開始・終了時刻が空欄で出力されます。

## Excelテンプレート

ブラウザ版にはサンエスExcelテンプレートを同梱しています。通常は追加のExcelファイルを選ばず、そのまま出力できます。

別のテンプレートを使う場合は、画面内の `Excelを変更` からXLSXを選択してください。

## Suica PDFの取得

1. [モバイルSuica](https://www.mobilesuica.com/index.aspx) にログインする。
2. SF(電子マネー)利用履歴ページを開く。
3. 「選択した履歴を印刷」からPDFを保存する。

通常のSuica PDFはテキスト層から抽出します。画像PDFなどでテキスト抽出できない場合だけOCRを使います。

OCRを使う場合は `jpn.traineddata.gz` が必要です。開発時は `web/public/tessdata/` に配置してください。公開版でも同じパスからローカル配信する想定です。

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

`master` にpushすると `.github/workflows/deploy-pages.yml` が `web/` をビルドし、GitHub Pagesへ公開します。

公開先は [https://opvelll.github.io/koutuhi/](https://opvelll.github.io/koutuhi/) です。

## 注意

このツールは請求書作成の補助です。抽出結果と生成されたExcelは提出前に必ず確認してください。

## Python版について

旧Python GUI/CLIは移行完了まで互換用に残しています。

```powershell
.\env\Scripts\python.exe -m pytest -q
```

Windows配布zipのrelease workflowも残していますが、現在の主導線はWeb版とGitHub Pages公開です。
