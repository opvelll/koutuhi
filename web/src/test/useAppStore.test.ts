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
      pdfFileName: "",
      reportDate: "",
      commuteEntries: [],
      generated: [],
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
      commuteEntries: [],
      message:
        "履歴を読み取れませんでした。モバイルSuicaのSF（電子マネー）利用履歴から保存した、文字を選択できるPDFか確認してください。",
    });
  });

  it("automatically selects the first workplace template matching the PDF route", async () => {
    useAppStore.setState({
      companyData: [
        {
          id: "company-first",
          companyName: "最初の会社",
          workLocation: "新宿本社",
          commuteRoute: "東京 ～ 新宿",
          startTime: "08:30",
          endTime: "17:30",
        },
        {
          id: "company-second",
          companyName: "2番目の会社",
          workLocation: "新宿支社",
          commuteRoute: "東京～新宿",
          startTime: "09:00",
          endTime: "18:00",
        },
      ],
    });
    vi.mocked(extractSuicaFromPdfFile).mockResolvedValue({
      reportDate: "2026/7/14",
      lines: [],
      rawText: "",
      records: [{
        id: "record-1",
        date: "2026/07/01",
        month: "07",
        day: "01",
        type1: "入",
        station1: "東京",
        type2: "出",
        station2: "新宿",
        amount: -210,
        balance: 1000,
        selected: true,
        selectable: true,
      }],
    });

    await useAppStore.getState().loadPdf({ name: "history.pdf" } as File);

    expect(useAppStore.getState().commuteEntries).toEqual([
      expect.objectContaining({
        companyDataId: "company-first",
        companyName: "最初の会社",
        workLocation: "新宿本社",
        startTime: "08:30",
        endTime: "17:30",
      }),
    ]);
  });

  it("updates company information once per route", () => {
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

  it("updates a default-confirmed route whose bus stops are absent from the PDF", () => {
    useAppStore.setState({
      commuteEntries: [{
        id: "bus-day",
        date: "2026/06/29",
        route: "竹ノ塚～仲御徒町 バス（都電都Ｂ）",
        routeKey: "竹ノ塚～仲御徒町バス(都電都B)",
        roundTripFare: 922,
        selected: true,
        companyName: "既存会社",
        workLocation: "両国",
        startTime: "08:30",
        endTime: "17:30",
        companyDataId: "company-1",
      }],
    });

    useAppStore.getState().setCommuteEntryRoute(
      "bus-day",
      "竹ノ塚～仲御徒町～上野松坂屋前（バス）",
    );
    expect(useAppStore.getState().commuteEntries[0]).toMatchObject({
      route: "竹ノ塚～仲御徒町～上野松坂屋前（バス）",
      routeKey: "竹ノ塚~仲御徒町~上野松坂屋前(バス)",
      companyDataId: undefined,
      companyName: "",
    });
  });

  it("recalculates the round-trip fare from selected breakdown items", () => {
    useAppStore.setState({
      commuteEntries: [{
        id: "fare-day",
        date: "2026/06/29",
        route: "竹ノ塚～両国 バス（都電都Ｂ）",
        routeKey: "竹ノ塚~両国バス(都電都B)",
        roundTripFare: 1030,
        selected: true,
        companyName: "",
        workLocation: "",
        startTime: "",
        endTime: "",
        fareItems: [
          { id: "rail-out", kind: "rail", label: "竹ノ塚 → 両国", amount: 410, selected: true },
          { id: "bus", kind: "bus", label: "都電都Ｂ", amount: 210, selected: true },
          { id: "rail-in", kind: "rail", label: "両国 → 竹ノ塚", amount: 410, selected: true },
        ],
      }],
      generated: [{ fileName: "stale.xlsx", blob: new Blob() }],
    });

    useAppStore.getState().toggleCommuteFareItem("fare-day", "bus");

    expect(useAppStore.getState()).toMatchObject({
      generated: [],
      commuteEntries: [{
        roundTripFare: 820,
        fareItems: [
          { id: "rail-out", selected: true },
          { id: "bus", selected: false },
          { id: "rail-in", selected: true },
        ],
      }],
    });
  });

  it("clears the current PDF editing data", () => {
    useAppStore.setState({
      status: "ready",
      message: "編集中",
      pdfFileName: "history.pdf",
      reportDate: "2026/07/31",
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
      pdfFileName: "",
      reportDate: "",
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
        startTime: "08:30",
        endTime: "17:45",
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

    useAppStore.getState().clearCompanyDataSelection("東京→新宿");
    expect(useAppStore.getState().commuteEntries).toEqual([
      expect.objectContaining({
        companyDataId: undefined,
        companyName: "",
        workLocation: "",
        startTime: "",
        endTime: "",
      }),
      expect.objectContaining({
        companyDataId: undefined,
        companyName: "",
        workLocation: "",
        startTime: "",
        endTime: "",
      }),
    ]);
  });
});
