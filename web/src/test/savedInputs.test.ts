import { describe, expect, it } from "vitest";

import { applyRouteProfiles, setRouteProfile } from "../lib/savedInputs";
import { normalizeRouteKey } from "../lib/suicaTransform";
import type { CommuteEntry } from "../types";

describe("saved commute inputs", () => {
  it("applies saved company and work location to the same normalized route", () => {
    const route = "竹ノ塚～地　入谷";
    const routeKey = normalizeRouteKey(route);
    const profiles = setRouteProfile({}, routeKey, "山田工業㈱", "袖ヶ浦1-5-6");

    expect(applyRouteProfiles([entryFor(route, routeKey)], profiles)).toEqual([
      {
        ...entryFor(route, routeKey),
        companyName: "山田工業㈱",
        workLocation: "袖ヶ浦1-5-6",
      },
    ]);
  });
});

function entryFor(route: string, routeKey: string): CommuteEntry {
  return {
    id: `2023/10/24:${routeKey}`,
    date: "2023/10/24",
    route,
    routeKey,
    roundTripFare: 712,
    selected: true,
    companyName: "",
    workLocation: "",
  };
}
