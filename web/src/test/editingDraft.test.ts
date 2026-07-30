import { describe, expect, it } from "vitest";

import {
  clearEditingDraft,
  loadEditingDraft,
  saveEditingDraft,
} from "../lib/editingDraft";
import type { CommuteEntry } from "../types";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

const commuteEntry: CommuteEntry = {
  id: "day-1",
  date: "2026/07/01",
  route: "東京 → 新宿",
  routeKey: "東京→新宿",
  roundTripFare: 420,
  selected: false,
  companyName: "山田工業㈱",
  workLocation: "",
  startTime: "08:30",
  endTime: "17:45",
  companyDataId: "company-1",
};

describe("editing draft storage", () => {
  it("restores parsed commute data and editing selections", () => {
    const storage = createStorage();
    saveEditingDraft({
      pdfFileName: "history.pdf",
      reportDate: "2026/07/31",
      records: [],
      commuteEntries: [commuteEntry],
    }, storage);

    expect(loadEditingDraft(storage)).toEqual({
      pdfFileName: "history.pdf",
      reportDate: "2026/07/31",
      records: [],
      commuteEntries: [commuteEntry],
    });
  });

  it("removes the editing draft", () => {
    const storage = createStorage();
    saveEditingDraft({
      pdfFileName: "history.pdf",
      reportDate: "2026/07/31",
      records: [],
      commuteEntries: [commuteEntry],
    }, storage);

    clearEditingDraft(storage);

    expect(loadEditingDraft(storage)).toBeNull();
  });
});
