import type { CommuteEntry, SuicaRecord } from "../types";

export function transformCommute(records: SuicaRecord[]): CommuteEntry[] {
  const grouped = new Map<string, SuicaRecord[]>();

  for (const record of records) {
    if (!["入", "＊入"].includes(record.type1)) {
      continue;
    }
    if (!record.station1 || !record.station2) {
      continue;
    }

    const list = grouped.get(record.date) ?? [];
    list.push(record);
    grouped.set(record.date, list);
  }

  return Array.from(grouped.entries()).map(([date, rows]) => {
    const route = buildRoute(rows);

    return {
      id: `${date}:${normalizeRouteKey(route)}`,
      date,
      route,
      routeKey: normalizeRouteKey(route),
      roundTripFare: rows.reduce((total, row) => total + Math.abs(row.amount), 0),
      selected: true,
      companyName: "",
      workLocation: "",
      startTime: "",
      endTime: "",
    };
  });
}

export function normalizeRouteKey(route: string): string {
  return route.normalize("NFKC").replace(/\s+/g, "").trim();
}

function buildRoute(rows: SuicaRecord[]): string {
  const seen = new Set<string>();
  const pairs: Array<[string, string]> = [];

  for (const row of rows) {
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

  return segments.map((segment) => segment.join("～")).join(" ");
}
