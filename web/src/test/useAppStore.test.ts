import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractSuicaFromPdfFile } from "../lib/pdfTextExtractor";
import { useAppStore } from "../store/useAppStore";

vi.mock("../lib/pdfTextExtractor", () => ({
  extractSuicaFromPdfFile: vi.fn(),
}));

describe("PDF loading state", () => {
  beforeEach(() => {
    useAppStore.setState({
      status: "idle",
      message: "",
      pdfFile: null,
      reportDate: "",
      records: [],
      commuteEntries: [],
      generated: [],
    });
    vi.mocked(extractSuicaFromPdfFile).mockReset();
  });

  it("reports an error when embedded text contains no history", async () => {
    vi.mocked(extractSuicaFromPdfFile).mockResolvedValue({
      reportDate: "2026/7/14",
      lines: [],
      records: [],
      rawText: "2026/7/14",
    });

    await useAppStore.getState().loadPdf({ name: "history.pdf" } as File);

    expect(useAppStore.getState()).toMatchObject({
      status: "error",
      reportDate: "2026/7/14",
      records: [],
      commuteEntries: [],
      message:
        "履歴を読み取れませんでした。モバイルSuicaのSF（電子マネー）利用履歴から保存した、文字を選択できるPDFか確認してください。",
    });
  });
});
