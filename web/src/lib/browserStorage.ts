export type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export function getBrowserStorage(): StorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStoredJson(
  key: string,
  storage: StorageLike | null = getBrowserStorage(),
): unknown {
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

export function writeStoredJson(
  key: string,
  value: unknown,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    // Browser storage is optional. Keep editing available when it is unavailable.
  }
}

export function removeStoredValue(
  key: string,
  storage: StorageLike | null = getBrowserStorage(),
): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Clearing visible state must still work when browser storage is unavailable.
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}
