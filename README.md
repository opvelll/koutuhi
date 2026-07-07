# 交通費請求書作成支援ツール

Suicaの利用履歴PDFから交通経路と運賃を抽出し、サンエス警備の「勤務表及び交通費請求書」Excelへ転記する補助ツールです。

現在はブラウザ版を `web/` 配下で移行中です。PDFとExcelテンプレートはローカルブラウザ内で処理し、既存のPython GUI/CLIは移行完了まで互換用に残しています。

## ブラウザ版

```powershell
pnpm install
pnpm dev:web
```

起動後、表示されたローカルURLをブラウザで開きます。通常は `http://127.0.0.1:5173/` です。

基本操作:

1. `PDF読込` でSuicaの利用履歴PDFを選択する。
2. `内容確認・入力` で抽出された履歴を確認し、請求対象や勤務先情報を調整する。
3. `Excel出力` でサンエスExcelテンプレートを使ってXLSXをダウンロードする。

検証:

```powershell
pnpm test:web
pnpm build:web
```

OCRフォールバックを使う場合は、`jpn.traineddata.gz` を `web/public/tessdata/` に配置してください。通常のSuica PDFはテキスト層から抽出するため、OCRデータは不要です。

## Suica PDFの取得

1. [モバイルSuica](https://www.mobilesuica.com/index.aspx) にログインする。
2. SF(電子マネー)利用履歴ページを開く。
3. 「選択した履歴を印刷」からPDFを保存する。

## Python版

既存GUI/CLIを使う場合の手順です。ブラウザ版への移行が完了するまでは残しています。

uvを使う場合:

```powershell
uv venv
uv pip install -r requirements.txt
uv run python main_gui.pyw
```

ローカル仮想環境を直接使う場合:

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

uvでテストする場合:

```powershell
uv pip install -r requirements-dev.txt
uv run pytest -q
```

## ダウンロードして使う場合

GitHub Releases から `koutuhi-windows.zip` をダウンロードし、任意のフォルダに展開してください。

展開後、`koutuhi.exe` をダブルクリックするとPython GUI版を起動できます。

```text
koutuhi-windows/
├── koutuhi.exe
└── setting/
    ├── defaults.yaml
    └── d54ff476ff529c75ab262cbbed599019.xlsx
```

`setting/defaults.yaml` で、支社・社員ID・氏名・出力先などの初期値を変更できます。`setting` フォルダは `koutuhi.exe` と同じ場所に置いてください。

## 注意

このツールは請求書作成の補助です。抽出結果と生成されたExcelは提出前に必ず確認してください。

## 開発者向け: Windows配布zipの作成

PowerShell:

```powershell
uv venv
uv pip install -r requirements-dev.txt
.\scripts\build_windows.ps1
```

成功すると `artifacts/koutuhi-windows.zip` が作成されます。

GitHub Releases では、`v0.1.0` のようなタグをpushすると `.github/workflows/release.yml` がWindows用zipをビルドし、リリースへ添付します。

```powershell
git tag v0.1.0
git push origin v0.1.0
```
