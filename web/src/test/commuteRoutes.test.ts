import { describe, expect, it } from "vitest";

import { groupCommuteEntriesByRoute } from "../lib/commuteRoutes";
import type { CommuteEntry } from "../types";

function entry(id: string, routeKey: string, route: string): CommuteEntry {
  return {
    id,
    date: `2026/07/0${id}`,
    route,
    routeKey,
    roundTripFare: 420,
    selected: true,
    companyName: "",
    workLocation: "",
  };
}

describe("groupCommuteEntriesByRoute", () => {
  it("shows one input row for repeated commute routes", () => {
    const grouped = groupCommuteEntriesByRoute([
      entry("1", "東京→新宿", "東京 → 新宿"),
      entry("2", "東京→新宿", "東京 → 新宿"),
      entry("3", "東京→品川", "東京 → 品川"),
    ]);

    expect(grouped.map(({ routeKey }) => routeKey)).toEqual([
      "東京→新宿",
      "東京→品川",
    ]);
  });
});
