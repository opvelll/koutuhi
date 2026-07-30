import { describe, expect, it } from "vitest";

import { loadCompanyData, saveCompanyData, upsertCompanyData } from "../lib/companyData";

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("workplace template storage", () => {
  it("saves and loads all application fields", () => {
    const storage = createStorage();
    const result = upsertCompanyData([], {
      companyName: "山田工業㈱",
      workLocation: "袖ヶ浦1-5-6",
      commuteRoute: "東京  →  新宿",
      startTime: "08:30",
      endTime: "17:45",
    }, "company-1");

    saveCompanyData(result.records, storage);

    expect(loadCompanyData(storage)).toEqual([
      expect.objectContaining({
        id: "company-1",
        companyName: "山田工業㈱",
        workLocation: "袖ヶ浦1-5-6",
        commuteRoute: "東京  →  新宿",
        startTime: "08:30",
        endTime: "17:45",
      }),
    ]);
  });

  it("keeps a workplace template when work location is blank", () => {
    const storage = createStorage();
    const result = upsertCompanyData([], {
      companyName: "山田工業㈱",
      workLocation: "",
      commuteRoute: "東京→新宿",
      startTime: "08:30",
      endTime: "17:45",
    }, "company-blank-location");

    saveCompanyData(result.records, storage);

    expect(loadCompanyData(storage)).toEqual([
      expect.objectContaining({
        id: "company-blank-location",
        workLocation: "",
      }),
    ]);
  });
});
