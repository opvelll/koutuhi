---
applyTo: "**"
---

# koutuhi プロジェクト Copilot 指示書

## 応答

- ユーザーへの説明は日本語で行う。
- Windows / PowerShell前提でコマンド例を書く。

## プロジェクト概要

モバイルSuicaの利用履歴PDFから通勤日・経路・運賃を読み取り、サンエス警備用の交通費請求書Excelを作成するブラウザアプリ。

## 技術スタック

- React、TypeScript、Vite
- Tailwind CSS
- PDF.js
- ExcelJS
- Zustand
- Vitest
- pnpm workspace

## 開発コマンド

```powershell
pnpm install
pnpm dev:web
pnpm test:web
pnpm build:web
```

## プロジェクト慣習

- Webアプリのソースは `web/` に置く。
- PDFとExcelはブラウザ内だけで処理し、外部サービスへ送信しない。
- 4ステップの操作導線と、GitHub Pages用のVite base `/koutuhi/` を維持する。
- 既定テンプレートは `web/public/templates/default-timesheet.xlsx` から読み込む。
- サンプルPDF、出力Excel、`node_modules/`、`web/dist/` はコミットしない。
