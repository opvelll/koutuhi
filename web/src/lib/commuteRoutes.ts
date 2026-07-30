import type { CommuteEntry } from "../types";

export function groupCommuteEntriesByRoute(entries: CommuteEntry[]): CommuteEntry[] {
  return Array.from(new Map(entries.map((entry) => [entry.routeKey, entry])).values());
}

export function groupSelectedCommuteEntriesByRoute(
  entries: CommuteEntry[],
): CommuteEntry[] {
  return groupCommuteEntriesByRoute(entries.filter((entry) => entry.selected));
}
