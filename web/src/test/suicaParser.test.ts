import { describe, expect, it } from "vitest";

import {
  addYearToDates,
  extractHistoryDate,
  parseSuicaHistoryText,
} from "../lib/suicaParser";
import { normalizeRouteKey, transformCommute } from "../lib/suicaTransform";

describe("Suica history parser", () => {
  it("extracts the report date from sample PDF text", () => {
    expect(extractHistoryDate("SF（電子マネー）利用履歴 2024/1/15")).toBe(
      "2024/1/15",
    );
  });

  it("parses 10/24 commute entries from sample-derived lines", () => {
    const records = addYearToDates(
      parseSuicaHistoryText([
        "10 16 繰 \\2,494",
        "10 18 入 竹ノ塚 出 東武押上 \\2,233 -261",
        "10 18 入 東武押上 出 竹ノ塚 \\1,972 -261",
        "10 24 入 竹ノ塚 出 地　入谷 \\1,616 -356",
        "10 24 入 地　入谷 出 竹ノ塚 \\1,260 -356",
      ]),
      "2024/1/15",
    );

    const subset = records
      .filter((record) => record.date === "2023/10/24")
      .map((record) => [record.station1, record.station2]);

    expect(subset).toEqual([
      ["竹ノ塚", "地　入谷"],
      ["地　入谷", "竹ノ塚"],
    ]);
  });

  it("builds commute route and round-trip fare", () => {
    const records = addYearToDates(
      parseSuicaHistoryText([
        "10 24 入 竹ノ塚 出 地　入谷 \\1,616 -356",
        "10 24 入 地　入谷 出 竹ノ塚 \\1,260 -356",
      ]),
      "2024/1/15",
    );

    const route = "竹ノ塚～地　入谷";
    const routeKey = normalizeRouteKey(route);

    const [commute] = transformCommute(records);

    expect(commute).toMatchObject({
      id: `2023/10/24:${routeKey}`,
      date: "2023/10/24",
      route,
      routeKey,
      roundTripFare: 712,
      selected: true,
      companyName: "",
      workLocation: "",
      startTime: "",
      endTime: "",
    });
    expect(commute.fareItems).toEqual([
      expect.objectContaining({
        kind: "rail",
        label: "竹ノ塚 → 地　入谷",
        amount: 356,
        selected: true,
      }),
      expect.objectContaining({
        kind: "rail",
        label: "地　入谷 → 竹ノ塚",
        amount: 356,
        selected: true,
      }),
    ]);
  });

  it("parses the new history format without a balance column", () => {
    const records = addYearToDates(
      parseSuicaHistoryText([
        "06 22 入 竹ノ塚 出 東武浅草 -261",
        "06 22 入 東武浅草 出 竹ノ塚 -261",
      ]),
      "2026/7/14",
    );

    expect(records).toMatchObject([
      {
        date: "2026/06/22",
        station1: "竹ノ塚",
        station2: "東武浅草",
        amount: -261,
        balance: 0,
      },
      {
        date: "2026/06/22",
        station1: "東武浅草",
        station2: "竹ノ塚",
        amount: -261,
        balance: 0,
      },
    ]);
    expect(transformCommute(records)).toMatchObject([
      {
        date: "2026/06/22",
        route: "竹ノ塚～東武浅草",
        roundTripFare: 522,
      },
    ]);
  });

  it("keeps supporting balance-bearing and mixed history formats", () => {
    const records = parseSuicaHistoryText([
      "06 22 入 竹ノ塚 出 東武浅草 \\2,233 -261",
      "06 22 入 東武浅草 出 竹ノ塚 -261",
    ]);

    expect(records.map(({ balance, amount }) => ({ balance, amount }))).toEqual([
      { balance: 2233, amount: -261 },
      { balance: 0, amount: -261 },
    ]);
  });

  it("adds a bus-only row to commuting and ignores other non-transport rows", () => {
    const records = addYearToDates(
      parseSuicaHistoryText([
        "06 25 現金 +1,000",
        "06 25 物販 -500",
        "06 29 ﾊﾞｽ等 都電都Ｂ -210",
        "07 08 現金 \\1,000",
      ]),
      "2026/7/14",
    );

    expect(records).toHaveLength(4);
    expect(records.map((record) => record.date)).toEqual([
      "2026/06/25",
      "2026/06/25",
      "2026/06/29",
      "2026/07/08",
    ]);
    expect(records.map((record) => record.selectable)).toEqual([
      false,
      false,
      true,
      false,
    ]);
    expect(transformCommute(records)).toEqual([
      {
        id: "2026/06/29:バス(都電都B)",
        date: "2026/06/29",
        route: "バス（都電都Ｂ）",
        routeKey: "バス(都電都B)",
        roundTripFare: 210,
        selected: true,
        companyName: "",
        workLocation: "",
        startTime: "",
        endTime: "",
        fareItems: [
          expect.objectContaining({
            kind: "bus",
            label: "都電都Ｂ",
            amount: 210,
            selected: true,
          }),
        ],
      },
    ]);
  });

  it("includes the bus fare in the attached PDF day's commute total", () => {
    const records = addYearToDates(
      parseSuicaHistoryText([
        "06 29 入 竹ノ塚 出 仲御徒町 -356",
        "06 29 ＊入 上御徒町 出 都　両国 -108",
        "06 29 バス等 都電都Ｂ -210",
        "06 29 入 仲御徒町 出 竹ノ塚 -356",
      ]),
      "2026/8/25",
    );

    expect(transformCommute(records)).toMatchObject([
      {
        date: "2026/06/29",
        route: "竹ノ塚～仲御徒町 上御徒町～都　両国 バス（都電都Ｂ）",
        roundTripFare: 1030,
        fareItems: [
          { kind: "rail", label: "竹ノ塚 → 仲御徒町", amount: 356, selected: true },
          { kind: "rail", label: "上御徒町 → 都　両国", amount: 108, selected: true },
          { kind: "bus", label: "都電都Ｂ", amount: 210, selected: true },
          { kind: "rail", label: "仲御徒町 → 竹ノ塚", amount: 356, selected: true },
        ],
      },
    ]);
  });
});
