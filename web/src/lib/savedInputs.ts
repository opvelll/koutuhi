import type {
  CommuteEntry,
  EmployeeSettings,
  RouteProfileMap,
} from "../types";

const settingsStorageKey = "koutuhi.employeeSettings.v1";
const routeProfilesStorageKey = "koutuhi.routeProfiles.v1";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function loadEmployeeSettings(
  defaults: EmployeeSettings,
  storage = getBrowserStorage(),
): EmployeeSettings {
  const parsed = readJson(settingsStorageKey, storage);
  if (!isRecord(parsed)) {
    return defaults;
  }

  return {
    branch: readString(parsed.branch, defaults.branch),
    employeeId: readString(parsed.employeeId, defaults.employeeId),
    name: readString(parsed.name, defaults.name),
  };
}

export function saveEmployeeSettings(
  settings: EmployeeSettings,
  storage = getBrowserStorage(),
): void {
  writeJson(settingsStorageKey, settings, storage);
}

export function loadRouteProfiles(
  storage = getBrowserStorage(),
): RouteProfileMap {
  const parsed = readJson(routeProfilesStorageKey, storage);
  if (!isRecord(parsed)) {
    return {};
  }

  const profiles: RouteProfileMap = {};
  for (const [routeKey, value] of Object.entries(parsed)) {
    if (!routeKey || !isRecord(value)) {
      continue;
    }

    profiles[routeKey] = {
      companyName: readString(value.companyName, ""),
      workLocation: readString(value.workLocation, ""),
      startTime: readString(value.startTime, ""),
      endTime: readString(value.endTime, ""),
      companyDataId: readOptionalString(value.companyDataId),
      updatedAt: readString(value.updatedAt, ""),
    };
  }

  return profiles;
}

export function saveRouteProfiles(
  profiles: RouteProfileMap,
  storage = getBrowserStorage(),
): void {
  writeJson(routeProfilesStorageKey, profiles, storage);
}

export function applyRouteProfiles(
  entries: CommuteEntry[],
  profiles: RouteProfileMap,
): CommuteEntry[] {
  return entries.map((entry) => {
    const profile = profiles[entry.routeKey];

    return {
      ...entry,
      companyName: profile?.companyName ?? entry.companyName,
      workLocation: profile?.workLocation ?? entry.workLocation,
      startTime: profile?.startTime ?? entry.startTime,
      endTime: profile?.endTime ?? entry.endTime,
      companyDataId: profile?.companyDataId ?? entry.companyDataId,
    };
  });
}

export function setRouteProfile(
  profiles: RouteProfileMap,
  routeKey: string,
  companyName: string,
  workLocation: string,
  startTime = "",
  endTime = "",
  companyDataId?: string,
): RouteProfileMap {
  const next = { ...profiles };
  if (!companyName.trim() && !workLocation.trim() && !startTime && !endTime) {
    delete next[routeKey];
    return next;
  }

  next[routeKey] = {
    companyName,
    workLocation,
    startTime,
    endTime,
    companyDataId,
    updatedAt: new Date().toISOString(),
  };
  return next;
}

export function clearRouteProfiles(storage = getBrowserStorage()): void {
  storage?.removeItem(routeProfilesStorageKey);
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

function writeJson(
  key: string,
  value: unknown,
  storage: StorageLike | null,
): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is a convenience. Input editing should keep working without it.
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}
