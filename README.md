# 交通費請求書作成支援ツール

Suicaの利用履歴PDFから交通経路と運賃を抽出し、サンエス警備の「勤務表及び交通費請求書」Excelへ転記する補助ツールです。

現在はブラウザ版を `web/` 配下で移行中です。既存のPython GUI/CLIも移行完了までは残しています。

## ブラウザ版

PDFとExcelテンプレートをローカルブラウザ内で処理します。外部OCR APIや外部サーバーへPDFは送信しません。

```powershell
pnpm install
pnpm dev:web
```

起動後、表示されたローカルURLをブラウザで開きます。通常は `http://127.0.0.1:5173/` です。

基本操作:

1. Suicaの利用履歴PDFを選択する。
2. 抽出された履歴を表で確認し、請求対象の行を選ぶ。
3. サンエス警備のExcelテンプレートを選択する。
4. 生成ボタンでXLSXをダウンロードする。

検証:

```powershell
pnpm test:web
pnpm build:web
```

OCRフォールバックを使う場合は、`jpn.traineddata.gz` を `web/public/tessdata/` に配置してください。通常のSuica PDFはテキスト層から抽出するため、OCRデータは不要です。

## Python版

既存GUIを使う場合の手順です。

```powershell
python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
python main_gui.pyw
```

仮想環境を有効化しない場合:

```powershell
.\env\Scripts\python.exe main_gui.pyw
```

Python側のテスト:

```powershell
.\env\Scripts\python.exe -m pytest -q
```

## Suica PDFの取得

1. [モバイルSuica](https://www.mobilesuica.com/index.aspx) にログインする。
2. SF(電子マネー)利用履歴ページを開く。
3. 「選択した履歴を印刷」からPDFを保存する。

## 注意

このツールは請求書作成の補助です。抽出結果と生成されたExcelは提出前に必ず確認してください。
