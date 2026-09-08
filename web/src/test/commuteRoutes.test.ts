import { describe, expect, it } from "vitest";

import {
  applyCompanyData,
  applyFirstMatchingCompanyData,
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

  it("automatically applies the first workplace template matching the route", () => {
    const entries = [
      entry("1", "東京→新宿", "東京 → 新宿"),
      entry("2", "東京→品川", "東京 → 品川"),
    ];
    const companyData = [
      {
        id: "company-first",
        companyName: "最初の会社",
        workLocation: "新宿本社",
        commuteRoute: "東京  →  新宿",
        startTime: "08:30",
        endTime: "17:30",
      },
      {
        id: "company-second",
        companyName: "2番目の会社",
        workLocation: "新宿支社",
        commuteRoute: "東京→新宿",
        startTime: "09:00",
        endTime: "18:00",
      },
    ];

    expect(applyFirstMatchingCompanyData(entries, companyData)).toEqual([
      expect.objectContaining({
        companyDataId: "company-first",
        companyName: "最初の会社",
        workLocation: "新宿本社",
        startTime: "08:30",
        endTime: "17:30",
      }),
      entries[1],
    ]);
  });

  it("fills only missing route and fare values when applying a template", () => {
    const template = {
      id: "company-bus",
      companyName: "バス会社",
      workLocation: "本社",
      commuteRoute: "駅前 ～ 本社前",
      startTime: "08:30",
      endTime: "17:30",
      roundTripFare: 380,
    };

    expect(applyCompanyData({
      ...entry("1", "", ""),
      roundTripFare: 0,
    }, template)).toMatchObject({
      route: "駅前 ～ 本社前",
      routeKey: "駅前~本社前",
      roundTripFare: 380,
      companyDataId: "company-bus",
    });

    expect(applyCompanyData({
      ...entry("2", "東京→新宿", "東京 → 新宿"),
      roundTripFare: 420,
    }, template)).toMatchObject({
      route: "東京 → 新宿",
      routeKey: "東京→新宿",
      roundTripFare: 420,
      companyDataId: "company-bus",
    });
  });
});
