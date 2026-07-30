import { describe, expect, it } from "vitest";

import {
  groupCommuteEntriesByRoute,
  groupSelectedCommuteEntriesByRoute,
} from "../lib/commuteRoutes";
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
    startTime: "",
    endTime: "",
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

  it("shows input rows only for routes included in selected days", () => {
    const selectedTokyo = entry("1", "東京→新宿", "東京 → 新宿");
    const unselectedTokyo = {
      ...entry("2", "東京→新宿", "東京 → 新宿"),
      selected: false,
    };
    const unselectedShinagawa = {
      ...entry("3", "東京→品川", "東京 → 品川"),
      selected: false,
    };

    expect(groupSelectedCommuteEntriesByRoute([
      selectedTokyo,
      unselectedTokyo,
      unselectedShinagawa,
    ]).map(({ routeKey }) => routeKey)).toEqual(["東京→新宿"]);

    expect(groupSelectedCommuteEntriesByRoute([
      { ...selectedTokyo, selected: false },
      unselectedTokyo,
      unselectedShinagawa,
    ])).toEqual([]);
  });
});
