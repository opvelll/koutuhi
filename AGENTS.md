# Repository Guidelines

- Respond to the user in Japanese.
- This is a browser-only project. Application source lives under `web/`.
- Run pnpm from the repository root: `pnpm install`, `pnpm dev:web`, `pnpm test:web`, `pnpm build:web`.
- The app is published at `https://opvelll.github.io/koutuhi/`; Vite must keep `base: "/koutuhi/"` for GitHub Pages.
- Do not send PDFs or Excel files to external APIs, OCR services, CDNs, or other servers. Process them locally in the browser.
- Do not commit generated files such as `node_modules/`, `web/dist/`, sample PDFs, output workbooks, logs, TypeScript build info, or Pages artifacts.

## Web App

- Keep browser-only code under `web/`.
- Preserve the four-step UX: `Suica利用履歴PDFを選ぶ` -> `通勤履歴を確認する` -> `勤務先・社員情報を入力する` -> `Excelを作成・保存する`.
- The default San-esu Excel template is `web/public/templates/default-timesheet.xlsx` and must be loaded through `import.meta.env.BASE_URL`.
- Route-specific saved inputs should stay focused on `companyName` and `workLocation`.
- Browser PDF parsing uses PDF.js text extraction. Image-only PDFs are not supported.
- When changing public assets, verify their generated paths under `/koutuhi/`.

## GitHub Pages

- Deployment workflow: `.github/workflows/deploy-pages.yml`.
- Deploy trigger: push to `master` or manual `workflow_dispatch`.
- Build output: `web/dist`.
- After publishing, verify the live app and `https://opvelll.github.io/koutuhi/templates/default-timesheet.xlsx`.

## Verification

```powershell
pnpm test:web
pnpm build:web
```
