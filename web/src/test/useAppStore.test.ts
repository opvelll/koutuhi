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
      routeProfiles: {},
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

  it("updates and saves company information once per route", () => {
    useAppStore.setState({
      commuteEntries: [
        {
          id: "day-1",
          date: "2026/07/01",
          route: "東京 → 新宿",
          routeKey: "東京→新宿",
          roundTripFare: 420,
          selected: true,
          companyName: "",
          workLocation: "",
        },
        {
          id: "day-2",
          date: "2026/07/02",
          route: "東京 → 新宿",
          routeKey: "東京→新宿",
          roundTripFare: 420,
          selected: true,
          companyName: "",
          workLocation: "",
        },
        {
          id: "day-3",
          date: "2026/07/03",
          route: "東京 → 品川",
          routeKey: "東京→品川",
          roundTripFare: 360,
          selected: true,
          companyName: "別会社",
          workLocation: "品川",
        },
      ],
    });

    useAppStore.getState().setCommuteRouteField("東京→新宿", "companyName", "サンエス");
    useAppStore.getState().setCommuteRouteField("東京→新宿", "workLocation", "新宿支社");

    const state = useAppStore.getState();
    expect(state.commuteEntries.map(({ companyName, workLocation }) => ({ companyName, workLocation }))).toEqual([
      { companyName: "サンエス", workLocation: "新宿支社" },
      { companyName: "サンエス", workLocation: "新宿支社" },
      { companyName: "別会社", workLocation: "品川" },
    ]);
    expect(state.routeProfiles["東京→新宿"]).toMatchObject({
      companyName: "サンエス",
      workLocation: "新宿支社",
    });
  });

  it("selects and clears all commute days", () => {
    useAppStore.setState({
      commuteEntries: [
        {
          id: "day-1",
          date: "2026/07/01",
          route: "東京 → 新宿",
          routeKey: "東京→新宿",
          roundTripFare: 420,
          selected: false,
          companyName: "",
          workLocation: "",
        },
        {
          id: "day-2",
          date: "2026/07/02",
          route: "東京 → 新宿",
          routeKey: "東京→新宿",
          roundTripFare: 420,
          selected: true,
          companyName: "",
          workLocation: "",
        },
      ],
    });

    useAppStore.getState().setAllCommuteEntries(true);
    expect(useAppStore.getState().commuteEntries.every((entry) => entry.selected)).toBe(true);

    useAppStore.getState().setAllCommuteEntries(false);
    expect(useAppStore.getState().commuteEntries.some((entry) => entry.selected)).toBe(false);
  });
});
