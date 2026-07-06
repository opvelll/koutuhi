import { describe, expect, it } from "vitest";

import {
  addYearToDates,
  extractHistoryDate,
  parseSuicaHistoryText,
} from "../lib/suicaParser";
import { transformCommute } from "../lib/suicaTransform";

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

    expect(transformCommute(records)).toEqual([
      {
        date: "2023/10/24",
        route: "竹ノ塚～地　入谷",
        roundTripFare: 712,
      },
    ]);
  });
});

