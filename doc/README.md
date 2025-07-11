# 交通費請求書作成支援ツール

## 概要

このツールは、給与明細（PDF）とSuicaの利用履歴（PDF）から、勤務日、勤務地、交通費の情報を抽出し、交通費請求書の作成を支援することを目的としています。
GUIアプリケーションを通じて、ユーザーは必要なPDFファイルを選択し、抽出されたデータを確認、編集することができます。

## 背景・目的

毎月の交通費請求書の作成は、複数の資料から情報を手動で転記する必要があり、手間のかかる作業です。このツールは、PDFからのデータ抽出を自動化することで、そのプロセスを簡略化し、時間短縮と入力ミス削減を目指します。

## 主な使用技術（技術スタック）

- **言語:** Python 3
- **GUI:** PySimpleGUI
- **PDF解析:** tabula-py, pdfminer.six, PyMuPDF,pdfplumber , (検討中)
- **データ操作:** pandas

## ディレクトリ構造

```
.
├── main.pyw                       # GUIアプリケーションのエントリポイント
├── analyze_pdf.py                 # PDF解析用スクリプト
├── requirements.txt               # 依存ライブラリリスト
├── test.ipynb                     # テスト用Jupyter Notebook
├── test3.py                       # テスト用スクリプト
├── sample/                        # サンプルPDF・Excelファイル
├── src/
│   ├── salary/
│   │   ├── Process.py                    # 給与明細解析共通モジュール
│   │   ├── Process_pymupdf_simple.py     # PyMuPDF簡易版解析
│   │   └── Process_pymupdf.py            # PyMuPDF詳細版解析
│   └── suica/
│       ├── Suica.py                      # Suica履歴共通インターフェース
│       ├── Suica_pdfplumber.py           # pdfplumber解析
│       └── Suica_pymupdf.py              # PyMuPDF解析
└── tests/                         # テストコード
```

## 設計

本アプリケーションは、以下の3つの主要モジュールから構成されています。

1. **`main.pyw` (GUI層):**
   - `PySimpleGUI`を使用してユーザーインターフェースを構築。
   - ユーザーからのファイル選択イベントを受け取り、`src.salary`、`src.suica`内の抽出関数を呼び出す。
   - 処理結果をテーブル形式で画面に表示する。

2. **`src/salary` (給与明細処理層):**
   - `Process.py` に共通インターフェースを定義。
   - `Process_pymupdf_simple.py`、`Process_pymupdf.py`でPyMuPDFを用いた抽出ロジックを実装。

3. **`src/suica` (Suica履歴処理層):**
   - `Suica.py` に共通インターフェースを定義。
   - `Suica_pdfplumber.py`で`pdfplumber`、`Suica_pymupdf.py`でPyMuPDFを用いた抽出ロジックを実装。

## 機能（できること）

-   GUIを通じて、給与明細のPDFファイルを選択し、勤務情報を抽出して表示する。
-   GUIを通じて、Suica利用履歴のPDFファイルを選択し、利用履歴を抽出して表示する。

## 未実装の機能・課題（できないこと）

-   **交通費請求書の自動作成:** 抽出したデータを元に、`sample`内のExcelフォーマットへ自動で書き込む機能は未実装です。
-   **データ連携:** 給与明細の勤務日とSuicaの利用履歴が連携されていません。
-   **エラーハンドリング:** PDFのフォーマットが想定と異なる場合や、ファイルが選択されなかった場合などのエラー処理が不十分です。
-   **給与明細の解析精度:**
    -   現状、勤務地の文字列が長い場合に、後続の金額カラムにデータが重なってしまい、正しく金額を抽出できていません。正規表現等を用いた、より柔軟なデータクリーニング処理が必要です。

## プロジェクトの起動方法

1.  **仮想環境の構築と有効化:**
    ```bash
    # 仮想環境を作成 (初回のみ)
    python -m venv env

    # 仮想環境を有効化 (Windowsの場合)
    .\env\Scripts\activate
    ```

2.  **依存ライブラリのインストール:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **アプリケーションの実行:**
    ```bash
    python main.pyw
    ```

## テスト環境

ここまでの設定でテスト環境が整っています。

- `requirements.txt` に `pytest`, `pytest-cov` を追加
- テストコードは `tests/` ディレクトリ以下に配置
- CLI での実行:

  ```powershell
  ./env/Scripts/python.exe -m pytest
  ```

- VSCode タスク (Run Pytest) から実行可能

## 注意点

-   本ツールのPDF解析ロジックは、`sample`ディレクトリにある特定のフォーマットを前提としています。異なるレイアウトのPDFでは、正常に動作しない可能性が高いです。
-   `tabula-py`はJavaに依存しているため、実行環境にJavaがインストールされている必要があります。