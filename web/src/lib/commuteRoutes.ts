import type { CompanyData, CommuteEntry } from "../types";
import { normalizeRouteKey } from "./suicaTransform";

export function applyCompanyData(
  entry: CommuteEntry,
  companyData: CompanyData,
): CommuteEntry {
  return {
    ...entry,
    companyName: companyData.companyName,
    workLocation: companyData.workLocation,
    startTime: companyData.startTime,
    endTime: companyData.endTime,
    companyDataId: companyData.id,
  };
}

export function applyFirstMatchingCompanyData(
  entries: CommuteEntry[],
  companyData: CompanyData[],
): CommuteEntry[] {
  const firstCompanyByRoute = new Map<string, CompanyData>();
  for (const record of companyData) {
    const routeKey = normalizeRouteKey(record.commuteRoute);
    if (routeKey && !firstCompanyByRoute.has(routeKey)) {
      firstCompanyByRoute.set(routeKey, record);
    }
  }

  return entries.map((entry) => {
    const matchingCompany = firstCompanyByRoute.get(entry.routeKey);
    return matchingCompany ? applyCompanyData(entry, matchingCompany) : entry;
  });
}

export function groupCommuteEntriesByRoute(entries: CommuteEntry[]): CommuteEntry[] {
  return Array.from(new Map(entries.map((entry) => [entry.routeKey, entry])).values());
}

export function groupSelectedCommuteEntriesByRoute(
  entries: CommuteEntry[],
): CommuteEntry[] {
  return groupCommuteEntriesByRoute(entries.filter((entry) => entry.selected));
}
