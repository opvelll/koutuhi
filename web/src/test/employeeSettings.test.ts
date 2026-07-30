import { describe, expect, it } from "vitest";

import {
  loadEmployeeSettings,
  saveEmployeeSettings,
} from "../lib/employeeSettings";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

describe("employee settings storage", () => {
  it("saves and restores employee settings", () => {
    const storage = createStorage();
    const settings = {
      branch: "千葉",
      employeeId: "67890",
      name: "山田 太郎",
    };

    saveEmployeeSettings(settings, storage);

    expect(loadEmployeeSettings({ branch: "", employeeId: "", name: "" }, storage))
      .toEqual(settings);
  });
});
