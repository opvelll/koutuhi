import type { CommuteEntry, SuicaRecord } from "../types";

const editingDraftStorageKey = "koutuhi.editingDraft.v1";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

export type EditingDraft = {
  pdfFileName: string;
  reportDate: string;
  records: SuicaRecord[];
  commuteEntries: CommuteEntry[];
};

export function loadEditingDraft(
  storage = getBrowserStorage(),
): EditingDraft | null {
  const raw = storage?.getItem(editingDraftStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    const records = Array.isArray(parsed.records)
      ? parsed.records.flatMap(readSuicaRecord)
      : [];
    const commuteEntries = Array.isArray(parsed.commuteEntries)
      ? parsed.commuteEntries.flatMap(readCommuteEntry)
      : [];

    if (commuteEntries.length === 0) {
      return null;
    }

    return {
      pdfFileName: readString(parsed.pdfFileName),
      reportDate: readString(parsed.reportDate),
      records,
      commuteEntries,
    };
  } catch {
    return null;
  }
}

export function saveEditingDraft(
  draft: EditingDraft,
  storage = getBrowserStorage(),
): void {
  try {
    storage?.setItem(editingDraftStorageKey, JSON.stringify(draft));
  } catch {
    // Draft persistence must not prevent in-browser editing.
  }
}

export function clearEditingDraft(storage = getBrowserStorage()): void {
  try {
    storage?.removeItem(editingDraftStorageKey);
  } catch {
    // Clearing the visible state should still work if storage is unavailable.
  }
}

function readSuicaRecord(value: unknown): SuicaRecord[] {
  if (!isRecord(value)) {
    return [];
  }

  const id = readString(value.id);
  const date = readString(value.date);
  if (!id || !date) {
    return [];
  }

  return [{
    id,
    date,
    month: readString(value.month),
    day: readString(value.day),
    type1: readString(value.type1),
    station1: readString(value.station1),
    type2: readString(value.type2),
    station2: readString(value.station2),
    amount: readNumber(value.amount),
    balance: readNumber(value.balance),
    selected: readBoolean(value.selected),
    selectable: readBoolean(value.selectable),
  }];
}

function readCommuteEntry(value: unknown): CommuteEntry[] {
  if (!isRecord(value)) {
    return [];
  }

  const id = readString(value.id);
  const date = readString(value.date);
  const route = readString(value.route);
  const routeKey = readString(value.routeKey);
  if (!id || !date || !route || !routeKey) {
    return [];
  }

  return [{
    id,
    date,
    route,
    routeKey,
    roundTripFare: readNumber(value.roundTripFare),
    selected: readBoolean(value.selected),
    companyName: readString(value.companyName),
    workLocation: readString(value.workLocation),
    startTime: readString(value.startTime),
    endTime: readString(value.endTime),
    companyDataId: readOptionalString(value.companyDataId),
  }];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}
