# Repository Guidelines

- Respond to the user in Japanese.
- Keep the browser app under `web/`. The existing Python GUI/CLI stays in place until migration is complete.
- For web work, use pnpm from the repository root: `pnpm install`, `pnpm dev:web`, `pnpm test:web`, `pnpm build:web`.
- For Python work, use the local virtual environment when available: `.\env\Scripts\python.exe -m pytest -q`.
- Browser PDF parsing should use PDF.js text extraction first. OCR is only a fallback for image PDFs.
- Do not send PDFs to external APIs or CDNs. If OCR is needed, serve `jpn.traineddata.gz` locally from `web/public/tessdata/`.
- Do not commit generated files such as `node_modules/`, `web/dist/`, sample PDFs, output workbooks, logs, or TypeScript build info.
