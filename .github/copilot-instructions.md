---
applyTo: "**"
---

## 概要
このツールは、給与明細（PDF）とSuicaの利用履歴（PDF）から、勤務日、勤務地、交通費の情報を抽出し、交通費請求書の作成を支援することを目的としています。
GUIアプリケーションを通じて、ユーザーは必要なPDFファイルを選択し、抽出されたデータを確認、編集することができます。

## 主な使用技術（技術スタック）

- **言語:** Python 3
- **GUI:** PySimpleGUI
- **PDF解析:** tabula-py, pdfminer.six, PyMuPDF,pdfplumber , (検討中)
- **データ操作:** pandas

## ディレクトリ構造

```
.
├── main.pyw          # GUIアプリケーションのメインファイル
├── Process.py        # 給与明細PDFの処理モジュール
├── Suica.py          # Suica利用履歴PDFの処理モジュール
├── requirements.txt  # 依存ライブラリリスト
├── sample/           # サンプルPDF・Excelファイル
└── README.md         # このファイル
```

## Agent Mode でのコマンドの実行
なるべくpythonのコードを生成したあとは、実行して確認してください。

```
./env/Scripts/python.exe hoge.py
```