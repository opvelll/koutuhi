import type { CommuteEntry, CommuteFareItem } from "../types";
import {
  isRecord,
  readOptionalString,
  readStoredJson,
  readString,
  removeStoredValue,
  writeStoredJson,
  type StorageLike,
} from "./browserStorage";

const editingDraftStorageKey = "koutuhi.editingDraft.v1";

export type EditingDraft = {
  pdfFileName: string;
  reportDate: string;
  commuteEntries: CommuteEntry[];
};

export function loadEditingDraft(
  storage?: StorageLike | null,
): EditingDraft | null {
  const parsed = readStoredJson(editingDraftStorageKey, storage);
  if (!isRecord(parsed)) {
    return null;
  }

  const commuteEntries = Array.isArray(parsed.commuteEntries)
    ? parsed.commuteEntries.flatMap(readCommuteEntry)
    : [];

  if (commuteEntries.length === 0) {
    return null;
  }

  return {
    pdfFileName: readString(parsed.pdfFileName),
    reportDate: readString(parsed.reportDate),
    commuteEntries,
  };
}

export function saveEditingDraft(
  draft: EditingDraft,
  storage?: StorageLike | null,
): void {
  writeStoredJson(editingDraftStorageKey, draft, storage);
}

export function clearEditingDraft(storage?: StorageLike | null): void {
  removeStoredValue(editingDraftStorageKey, storage);
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

  const fareItems = Array.isArray(value.fareItems)
    ? value.fareItems.flatMap(readFareItem)
    : [];
  const roundTripFare = fareItems.length > 0
    ? fareItems.reduce(
        (total, item) => total + (item.selected ? item.amount : 0),
        0,
      )
    : readNumber(value.roundTripFare);

  return [{
    id,
    date,
    route,
    routeKey,
    roundTripFare,
    selected: readBoolean(value.selected),
    companyName: readString(value.companyName),
    workLocation: readString(value.workLocation),
    startTime: readString(value.startTime),
    endTime: readString(value.endTime),
    companyDataId: readOptionalString(value.companyDataId),
    ...(fareItems.length > 0 ? { fareItems } : {}),
  }];
}

function readFareItem(value: unknown): CommuteFareItem[] {
  if (!isRecord(value)) {
    return [];
  }

  const id = readString(value.id);
  const label = readString(value.label);
  const kind = value.kind === "bus" ? "bus" : value.kind === "rail" ? "rail" : "";
  if (!id || !label || !kind) {
    return [];
  }

  return [{
    id,
    kind,
    label,
    amount: Math.abs(readNumber(value.amount)),
    selected: readBoolean(value.selected),
  }];
}

function readNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}
