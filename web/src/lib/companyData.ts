import type { CompanyData, CompanyDataInput } from "../types";
import { normalizeRouteKey } from "./suicaTransform";

const companyDataStorageKey = "koutuhi.companyData.v1";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function loadCompanyData(storage = getBrowserStorage()): CompanyData[] {
  const parsed = readJson(companyDataStorageKey, storage);
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
      routeKey: normalizeRouteKey(commuteRoute),
      startTime: readString(value.startTime),
      endTime: readString(value.endTime),
      updatedAt: readString(value.updatedAt),
    }];
  });
}

export function saveCompanyData(
  records: CompanyData[],
  storage = getBrowserStorage(),
): void {
  writeJson(companyDataStorageKey, records, storage);
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
    routeKey: normalizeRouteKey(input.commuteRoute),
    startTime: input.startTime,
    endTime: input.endTime,
    updatedAt: new Date().toISOString(),
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

function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson(key: string, storage: StorageLike | null): unknown {
  const raw = storage?.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, storage: StorageLike | null): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is optional. Editing remains available without localStorage.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
