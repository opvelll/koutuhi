---
applyTo: "**"
---

# koutuhi プロジェクト Copilot 指示書

## 1. プロジェクト概要
- 給与明細（PDF）とSuica利用履歴（PDF）から勤務日・勤務地・交通費を抽出し、交通費請求書（Excel）を自動生成するPythonツール。
- GUI（PySimpleGUI）とCLIの両方を提供し、ユーザーはPDFを選択してデータを確認・編集可能。

## 2. 技術スタック
- OS: Windows 11
- シェル: PowerShell (`pwsh.exe`)
- 言語: Python 3.12, 仮想環境: venv (`env/Scripts/Activate.ps1`)
- PDF解析: PyMuPDF (`src/suica/Suica_pymupdf.py`), pdfplumber, tabula-py, pdfminer.six
- データ操作: pandas, openpyxl
- 設定: YAML (`setting/defaults.yaml`)
- テスト: pytest (`tests/`)

## 3. リポジトリ構造
```
.
├── main.pyw             # GUIエントリポイント (PySimpleGUI)
├── main_cli.pyw         # CLIエントリポイント
├── fill_timesheet.py    # Suica履歴をExcel勤務表に反映
├── analyze_pdf.py       # PDF解析ユーティリティ（salary, suica）
├── generate_report.py   # レポート生成スクリプト
├── requirements.txt     # 依存パッケージ一覧
├── sample/              # サンプルPDF・Excelテンプレート
├── output/              # 自動生成される勤務表Excel
├── setting/             # 固定設定 (defaults.yaml)
├── src/
│   ├── salary/         # 給与明細PDF処理モジュール
│   ├── suica/          # Suica履歴PDF処理モジュール
│   └── util/           # 共通ユーティリティ
├── tests/               # pytest テスト
└── .github/
    └── copilot-instructions.md  # このファイル
```

## 4. 開発ワークフロー
1. 仮想環境の有効化:
   ```powershell
   .\env\Scripts\Activate.ps1
   ```
2. 依存パッケージのインストール・更新:
   ```powershell
   pip install -r requirements.txt
   ```
3. GUI 実行:
   ```powershell
   .\env\Scripts\python.exe main.pyw
   ```
4. CLI 実行 / サンプルスクリプト:
   ```powershell
   .\env\Scripts\python.exe fill_timesheet.py
   ```
5. テスト実行:
   - VSCode タスク: "Run Pytest"
   - 直接:
     ```powershell
     .\env\Scripts\python.exe -m pytest
     ```

## 5. プロジェクトの慣習・パターン
- **単一ファイル実行**: `main.pyw`, `main_cli.pyw`, `fill_timesheet.py` は単体で起動し、`print()` で実行結果を出力、コード内にコメント付きサンプル結果を残す。
- **Pathlib & Config**: ファイルパスは必ず `pathlib.Path` で扱い、静的情報は `setting/defaults.yaml` から読み込む (`load_defaults`)。
- **Excel 反映**: `openpyxl` でテンプレート（`sample/*.xlsx`）を読み込み、`write_report_date`, `write_static_entries`, `write_commute_entries` 関数で値を埋める。
- **PDF → DataFrame**: Suica用 `extract_suica_history_pymupdf` と `add_year_to_dates`, `transform_commute` を組み合わせてDataFrameに変換。
- **テスト命名**: `tests/test_*.py` にまとめ、テスト対象の振る舞い（例: 出力ExcelのJ3/Q3/Z3セル検証）をシンプルに記述。

## 6. コーディング時の注意点
- 新規モジュールは必ず `src/` 以下に配置し、相対インポートを使って参照する。
- GUI と CLI のエントリポイントは分離する（`main.pyw` と `main_cli.pyw`）。
- 既存セルへの書き込みは上書き禁止のロジックを保持 (`if cell.value in (None, ''):`)。
- テスト用 `output/` フォルダは.gitignoreに含めず、テスト前に再生成されることを確認。

---

この内容で不明点や追記項目があれば教えてください。