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
      pdfFileName: "",
      reportDate: "",
      records: [],
      commuteEntries: [],
      generated: [],
      routeProfiles: {},
      companyData: [],
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
          startTime: "",
          endTime: "",
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
          startTime: "",
          endTime: "",
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
          startTime: "",
          endTime: "",
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
          startTime: "",
          endTime: "",
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
          startTime: "",
          endTime: "",
        },
      ],
    });

    useAppStore.getState().setAllCommuteEntries(true);
    expect(useAppStore.getState().commuteEntries.every((entry) => entry.selected)).toBe(true);

    useAppStore.getState().setAllCommuteEntries(false);
    expect(useAppStore.getState().commuteEntries.some((entry) => entry.selected)).toBe(false);
  });

  it("clears the current PDF editing data", () => {
    useAppStore.setState({
      status: "ready",
      message: "編集中",
      pdfFile: { name: "history.pdf" } as File,
      pdfFileName: "history.pdf",
      reportDate: "2026/07/31",
      records: [{
        id: "record-1",
        date: "2026/07/01",
        month: "07",
        day: "01",
        type1: "入",
        station1: "東京",
        type2: "出",
        station2: "新宿",
        amount: 210,
        balance: 1000,
        selected: true,
        selectable: true,
      }],
      commuteEntries: [{
        id: "day-1",
        date: "2026/07/01",
        route: "東京 → 新宿",
        routeKey: "東京→新宿",
        roundTripFare: 420,
        selected: true,
        companyName: "",
        workLocation: "",
        startTime: "",
        endTime: "",
      }],
      generated: [{ fileName: "output.xlsx", blob: new Blob() }],
    });

    useAppStore.getState().clearCurrentEditingData();

    expect(useAppStore.getState()).toMatchObject({
      status: "idle",
      message: "",
      pdfFile: null,
      pdfFileName: "",
      reportDate: "",
      records: [],
      commuteEntries: [],
      generated: [],
    });
  });

  it("applies a workplace template to every day on the selected route", () => {
    useAppStore.setState({
      companyData: [{
        id: "company-1",
        companyName: "山田工業㈱",
        workLocation: "袖ヶ浦1-5-6",
        commuteRoute: "東京 → 新宿",
        routeKey: "東京→新宿",
        startTime: "08:30",
        endTime: "17:45",
        updatedAt: "2026-07-30T00:00:00.000Z",
      }],
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
          startTime: "",
          endTime: "",
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
          startTime: "",
          endTime: "",
        },
      ],
    });

    useAppStore.getState().applyCompanyDataToRoute("東京→新宿", "company-1");

    expect(useAppStore.getState().commuteEntries).toEqual([
      expect.objectContaining({
        companyDataId: "company-1",
        companyName: "山田工業㈱",
        workLocation: "袖ヶ浦1-5-6",
        startTime: "08:30",
        endTime: "17:45",
      }),
      expect.objectContaining({
        companyDataId: "company-1",
        companyName: "山田工業㈱",
        workLocation: "袖ヶ浦1-5-6",
        startTime: "08:30",
        endTime: "17:45",
      }),
    ]);

    useAppStore.getState().setCommuteRouteField("東京→新宿", "endTime", "18:00");
    expect(useAppStore.getState().commuteEntries).toEqual([
      expect.objectContaining({ companyDataId: "company-1", endTime: "18:00" }),
      expect.objectContaining({ companyDataId: "company-1", endTime: "18:00" }),
    ]);

    useAppStore.getState().setCommuteRouteField("東京→新宿", "companyName", "山田工業㈱（臨時）");
    useAppStore.getState().setCommuteRouteField("東京→新宿", "startTime", "09:00");
    expect(useAppStore.getState().commuteEntries).toEqual([
      expect.objectContaining({
        companyDataId: "company-1",
        companyName: "山田工業㈱（臨時）",
        startTime: "09:00",
      }),
      expect.objectContaining({
        companyDataId: "company-1",
        companyName: "山田工業㈱（臨時）",
        startTime: "09:00",
      }),
    ]);

    expect(useAppStore.getState().companyData[0]).toMatchObject({
      id: "company-1",
      companyName: "山田工業㈱",
      startTime: "08:30",
      endTime: "17:45",
    });
  });
});
