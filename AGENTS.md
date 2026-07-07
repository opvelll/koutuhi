# Repository Guidelines

- Respond to the user in Japanese.
- Treat the browser app under `web/` as the primary migration path. The existing Python GUI/CLI stays in place until migration is complete.
- For web work, run pnpm from the repository root: `pnpm install`, `pnpm dev:web`, `pnpm test:web`, `pnpm build:web`.
- Browser PDF parsing should use PDF.js text extraction first. OCR is only a fallback for image PDFs.
- Do not send PDFs to external APIs or CDNs. If OCR is needed, serve `jpn.traineddata.gz` locally from `web/public/tessdata/`.
- Do not commit generated files such as `node_modules/`, `web/dist/`, sample PDFs, output workbooks, logs, or TypeScript build info.

## Web App

- Source lives under `web/`; keep browser-only code there.
- PDFs and Excel templates should be processed locally in the browser.
- The default browser template is served from `web/public/templates/default-timesheet.xlsx`.
- Preserve the staged UX: `PDF読込` -> `内容確認・入力` -> `Excel出力`.
- Prefer PDF.js text extraction. Use OCR only when a PDF has no usable text layer.

## Python Compatibility

- For Python work, use the local virtual environment when available: `.\env\Scripts\python.exe -m pytest -q`.
- If the local env is not available, use uv with Python 3.12:
  ```powershell
  uv venv
  uv pip install -r requirements-dev.txt
  uv run pytest -q
  ```
- Main Python entry points are `main_gui.pyw` and `main_cli.pyw`.
- Core Python modules include `src/fill_timesheet.py`, `src/app_paths.py`, `src/suica/Suica_pymupdf.py`, and `src/suica/suica_transform.py`.
- Keep Python tests independent of pre-existing files in `sample/` or `output/`.

## Verification

After web changes, run:

```powershell
pnpm test:web
pnpm build:web
```

After Python changes, run the local-env pytest command above when possible. If using uv, also run:

```powershell
uv run python -m py_compile main_gui.pyw main_cli.pyw src\app_paths.py src\fill_timesheet.py src\suica\Suica_pymupdf.py src\suica\suica_transform.py src\suica\date_extractor.py
```

## Release

- Windows distribution files are under `packaging/` and `scripts/`.
- PyInstaller config: `packaging/koutuhi.spec`.
- Local Windows build:
  ```powershell
  .\scripts\build_windows.ps1
  ```
- GitHub Releases are created by `.github/workflows/release.yml` when pushing `v*` tags.
- Generated `artifacts/`, `dist/`, `build/`, and `.venv-build/` directories must not be committed.
