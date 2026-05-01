# Agent Notes

このリポジトリでは日本語でユーザーに応答する。

## Project

Suica利用履歴PDFから交通費情報を抽出し、会社指定の勤務表・交通費請求書Excelへ転記するWindows向けPythonツール。

主な入口:
- GUI: `main_gui.pyw`
- CLI: `main_cli.pyw`
- コア処理: `src/fill_timesheet.py`
- Suica PDF抽出: `src/suica/Suica_pymupdf.py`
- Suica履歴変換: `src/suica/suica_transform.py`

## Environment

uvを優先する。Pythonは`.python-version`で3.12を指定している。

PowerShell:

```powershell
uv venv
uv pip install -r requirements-dev.txt
uv run pytest -q
```

実行時依存だけでよい場合:

```powershell
uv pip install -r requirements.txt
```

この環境で`uv`が見つからない場合、ユーザーPATHには通常`C:\Users\<ユーザー名>\.local\bin`が入っている。Codexなど既存セッションのプロセスPATHに反映されていないだけなら、PowerShell内で一時的に追加できる。

```powershell
$env:Path = $env:Path.TrimEnd(';') + ';' + (Join-Path $env:USERPROFILE '.local\bin')
```

## Verification

変更後は最低限これを実行する。

```powershell
uv run pytest -q
uv run python -m py_compile main_gui.pyw main_cli.pyw src\fill_timesheet.py src\suica\Suica_pymupdf.py src\suica\suica_transform.py src\suica\date_extractor.py
```

Suica PDFは個人情報を含むため、リポジトリにコミットしない。`.gitignore`の`sample/`に置いて手動確認する想定。

CLIで本番に近い確認をする場合:

```powershell
uv run python main_cli.pyw --pdf sample\suica.pdf
```

GUI確認:

```powershell
uv run python main_gui.pyw
```

## Dependencies

- `requirements.txt`: アプリ実行に必要な依存のみ。
- `requirements-dev.txt`: テスト用依存を含む。
- PySimpleGUIは現状`PySimpleGUI>=6,<7`で利用中。長期的にはFreeSimpleGUIやPySide6への移行余地があるが、今は移行しない。
- pandasはSuica履歴の表処理、日付ごとの集計、Excel出力前の年月グルーピングに使う。

## Code Notes

- テンプレートExcelの既定パスは`setting/d54ff476ff529c75ab262cbbed599019.xlsx`。
- 出力先は`setting/defaults.yaml`の`output_dir`で指定でき、`desktop`はデスクトップとして扱う。
- PDF抽出失敗や空データはGUIでエラー表示できるよう、コア関数では`ValueError`を投げる。
- テストは`sample/`や`output/`の事前ファイルに依存させない。
