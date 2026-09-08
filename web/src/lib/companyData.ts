import type { CompanyData, CompanyDataInput } from "../types";
import {
  isRecord,
  readStoredJson,
  readString,
  writeStoredJson,
  type StorageLike,
} from "./browserStorage";

const companyDataStorageKey = "koutuhi.companyData.v1";

export function loadCompanyData(storage?: StorageLike | null): CompanyData[] {
  const parsed = readStoredJson(companyDataStorageKey, storage);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((value) => {
    if (!isRecord(value)) {
      return [];
    }

    const id = readString(value.id);
    const companyName = readString(value.companyName);
    const workLocation = readString(value.workLocation);
    const commuteRoute = readString(value.commuteRoute);
    if (!id || !companyName || !commuteRoute) {
      return [];
    }

    return [{
      id,
      companyName,
      workLocation,
      commuteRoute,
      startTime: readString(value.startTime),
      endTime: readString(value.endTime),
      roundTripFare: readOptionalFare(value.roundTripFare),
    }];
  });
}

export function saveCompanyData(
  records: CompanyData[],
  storage?: StorageLike | null,
): void {
  writeStoredJson(companyDataStorageKey, records, storage);
}

export function upsertCompanyData(
  records: CompanyData[],
  input: CompanyDataInput,
  id?: string,
): { records: CompanyData[]; saved: CompanyData } {
  const saved: CompanyData = {
    id: id ?? createId(),
    companyName: input.companyName.trim(),
    workLocation: input.workLocation.trim(),
    commuteRoute: input.commuteRoute.trim(),
    startTime: input.startTime,
    endTime: input.endTime,
    roundTripFare: normalizeFare(input.roundTripFare),
  };
  const existingIndex = records.findIndex((record) => record.id === saved.id);
  const next = [...records];
  if (existingIndex >= 0) {
    next[existingIndex] = saved;
  } else {
    next.push(saved);
  }

  next.sort((a, b) => a.companyName.localeCompare(b.companyName, "ja"));
  return {
    records: next,
    saved,
  };
}

export function removeCompanyData(records: CompanyData[], id: string): CompanyData[] {
  return records.filter((record) => record.id !== id);
}

function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `company-${Date.now()}`;
}

function readOptionalFare(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function normalizeFare(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}
