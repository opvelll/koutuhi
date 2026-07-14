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

    expect(transformCommute(records)).toEqual([
      {
        id: `2023/10/24:${routeKey}`,
        date: "2023/10/24",
        route,
        routeKey,
        roundTripFare: 712,
        selected: true,
        companyName: "",
        workLocation: "",
      },
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

  it("parses non-transport rows without selecting them for commuting", () => {
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
    expect(records.every((record) => !record.selectable)).toBe(true);
    expect(transformCommute(records)).toEqual([]);
  });
});
