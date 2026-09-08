import type { CommuteEntry, CommuteFareItem, SuicaRecord } from "../types";

export function transformCommute(records: SuicaRecord[]): CommuteEntry[] {
  const grouped = new Map<string, SuicaRecord[]>();

  for (const record of records) {
    if (!isRailRide(record) && !isBusRide(record)) {
      continue;
    }

    const list = grouped.get(record.date) ?? [];
    list.push(record);
    grouped.set(record.date, list);
  }

  return Array.from(grouped.entries()).map(([date, rows]) => {
    const railRows = rows.filter(isRailRide);
    const busRows = rows.filter(isBusRide);
    const route = railRows.length === 0 ? "" : buildRoute(railRows, busRows);
    const fareItems = rows.map(createFareItem);

    return {
      id: `${date}:${normalizeRouteKey(route)}`,
      date,
      route,
      routeKey: normalizeRouteKey(route),
      roundTripFare: fareItems.reduce((total, item) => total + item.amount, 0),
      selected: true,
      companyName: "",
      workLocation: "",
      startTime: "",
      endTime: "",
      fareItems,
    };
  });
}

export function normalizeRouteKey(route: string): string {
  return route.normalize("NFKC").replace(/\s+/g, "").trim();
}

function buildRoute(railRows: SuicaRecord[], busRows: SuicaRecord[]): string {
  const seen = new Set<string>();
  const pairs: Array<[string, string]> = [];

  for (const row of railRows) {
    const a = row.station1.trim();
    const b = row.station2.trim();
    const key = [a, b].sort().join("\0");
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    pairs.push([a, b]);
  }

  const segments: string[][] = [];
  let current: string[] | null = null;
  let previousEnd = "";

  for (const [start, end] of pairs) {
    if (!current) {
      current = [start, end];
      previousEnd = end;
      continue;
    }

    if (start === previousEnd) {
      current.push(end);
      previousEnd = end;
    } else {
      segments.push(current);
      current = [start, end];
      previousEnd = end;
    }
  }

  if (current) {
    segments.push(current);
  }

  const railRoute = segments.map((segment) => segment.join("～")).join(" ");
  const busOperators = Array.from(new Set(
    busRows.map((row) => row.station1.trim()).filter(Boolean),
  ));
  const busRoute = busOperators.length > 0
    ? `バス（${busOperators.join("・")}）`
    : busRows.length > 0
      ? "バス"
      : "";

  return [railRoute, busRoute].filter(Boolean).join(" ");
}

function isRailRide(record: SuicaRecord): boolean {
  return ["入", "＊入"].includes(record.type1) &&
    Boolean(record.station1 && record.station2);
}

function isBusRide(record: SuicaRecord): boolean {
  return record.type1.normalize("NFKC") === "バス等";
}

function createFareItem(record: SuicaRecord): CommuteFareItem {
  const bus = isBusRide(record);

  return {
    id: record.id,
    kind: bus ? "bus" : "rail",
    label: bus
      ? record.station1 || "バス"
      : `${record.station1} → ${record.station2}`,
    amount: Math.abs(record.amount),
    selected: true,
  };
}
