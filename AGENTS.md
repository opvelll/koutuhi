# Repository Guidelines

- Respond to the user in Japanese.
- Treat the browser app under `web/` as the primary product surface. The Python GUI/CLI remains only as compatibility code until migration is complete.
- For web work, run pnpm from the repository root: `pnpm install`, `pnpm dev:web`, `pnpm test:web`, `pnpm build:web`.
- The app is published at `https://opvelll.github.io/koutuhi/`; Vite must keep `base: "/koutuhi/"` for GitHub Pages.
- Do not send PDFs to external APIs, external OCR services, or CDNs. Browser PDF parsing should use PDF.js text extraction first.
- OCR is only a fallback for image PDFs. If OCR is needed, serve `jpn.traineddata.gz` locally from `web/public/tessdata/`.
- Do not commit generated files such as `node_modules/`, `web/dist/`, sample PDFs, output workbooks, logs, TypeScript build info, or Pages artifacts.

## Web App

- Source lives under `web/`; keep browser-only code there.
- PDFs and Excel templates should be processed locally in the browser.
- Preserve the staged UX: `PDF読込` -> `内容確認・入力` -> `Excel出力`.
- The default San-esu Excel template is `web/public/templates/default-timesheet.xlsx` and should be loaded through `import.meta.env.BASE_URL`.
- Route-specific saved inputs should stay focused on `companyName` and `workLocation`.
- When changing public assets under `web/public/`, verify that the generated GitHub Pages path works under `/koutuhi/`.

## GitHub Pages

- Deployment workflow: `.github/workflows/deploy-pages.yml`.
- Deploy trigger: push to `master` or manual `workflow_dispatch`.
- Build output: `web/dist`.
- After publishing changes, verify the live URL and at least the default template URL: `https://opvelll.github.io/koutuhi/templates/default-timesheet.xlsx`.
- If Pages returns 404 for a new repo, enable it with workflow mode via GitHub Pages API before rerunning or waiting for the deploy workflow.

## Verification

For web changes, run:

```powershell
pnpm test:web
pnpm build:web
```

For Python compatibility changes, run the local env when available:

```powershell
.\env\Scripts\python.exe -m pytest -q
```

If the local env is unavailable, use uv:

```powershell
uv venv
uv pip install -r requirements-dev.txt
uv run pytest -q
```

## Python Compatibility

- Main Python entry points are `main_gui.pyw` and `main_cli.pyw`.
- Core Python modules include `src/fill_timesheet.py`, `src/app_paths.py`, `src/suica/Suica_pymupdf.py`, and `src/suica/suica_transform.py`.
- Keep Python tests independent of pre-existing files in `sample/` or `output/`.
- Windows release packaging remains under `packaging/`, `scripts/`, and `.github/workflows/release.yml`, but it is not the primary user path.
