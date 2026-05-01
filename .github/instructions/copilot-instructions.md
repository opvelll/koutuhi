---
applyTo: "**"
---

# koutuhi プロジェクト Copilot 指示書

## 応答

- ユーザーへの説明は日本語で行う。
- Windows / PowerShell 前提でコマンド例を書く。

## プロジェクト概要

Suica利用履歴PDFから交通経路・交通費を抽出し、会社指定の「勤務表及び交通費請求書」Excelに自動入力するPythonツール。

主な入口:
- GUI: `main_gui.pyw`
- CLI: `main_cli.pyw`
- Excel生成処理: `src/fill_timesheet.py`
- Suica PDF抽出: `src/suica/Suica_pymupdf.py`
- Suica履歴変換: `src/suica/suica_transform.py`

## 技術スタック

- OS: Windows
- Python: 3.12 (`.python-version`)
- 環境管理: uv優先
- GUI: PySimpleGUI
- PDF解析: PyMuPDF, pdfplumber, tabula-py, pdfminer.six
- データ操作: pandas
- Excel操作: openpyxl
- 設定: YAML (`setting/defaults.yaml`)
- テスト: pytest

## 開発ワークフロー

uvを使う。

```powershell
uv venv
uv pip install -r requirements-dev.txt
uv run pytest -q
```

実行時依存だけを入れる場合:

```powershell
uv pip install -r requirements.txt
```

`uv`が見つからない既存セッションでは、必要に応じて一時的にPATHへ追加する。

```powershell
$env:Path = $env:Path.TrimEnd(';') + ';' + (Join-Path $env:USERPROFILE '.local\bin')
```

## 実行コマンド

GUI:

```powershell
uv run python main_gui.pyw
```

CLI:

```powershell
uv run python main_cli.pyw --pdf sample\suica.pdf
```

テスト:

```powershell
uv run pytest -q
```

構文チェック:

```powershell
uv run python -m py_compile main_gui.pyw main_cli.pyw src\fill_timesheet.py src\suica\Suica_pymupdf.py src\suica\suica_transform.py src\suica\date_extractor.py
```

## リポジトリ構造

```text
.
├── main_gui.pyw
├── main_cli.pyw
├── requirements.txt
├── requirements-dev.txt
├── pytest.ini
├── setting/
│   ├── defaults.yaml
│   └── d54ff476ff529c75ab262cbbed599019.xlsx
├── src/
│   ├── fill_timesheet.py
│   ├── salary/
│   ├── suica/
│   └── util/
└── tests/
```

## プロジェクト慣習

- ファイルパスは`pathlib.Path`を使う。
- 固定情報は`setting/defaults.yaml`から読み込む。
- テンプレートExcelの既定パスは`setting/d54ff476ff529c75ab262cbbed599019.xlsx`。
- `output_dir: desktop`はデスクトップ出力として扱う。
- 既存Excelセルへの書き込みは、空欄の場合だけ行うロジックを維持する。
- Suica PDFや生成済みExcelは個人情報を含みやすいため、`sample/`や`output/`に置いてコミットしない。
- テストは`sample/`や`output/`の事前ファイルに依存させない。

## 依存関係

- `requirements.txt`はアプリ実行に必要な依存だけを置く。
- `requirements-dev.txt`は`pytest`などテスト用依存を置く。
- pandasはSuica履歴の表処理、日付ごとの集計、Excel出力前の年月グルーピングに使う。
- PySimpleGUIは当面使い続ける。長期的にはFreeSimpleGUIやPySide6移行を検討するが、この作業では移行しない。
