import type { EmployeeSettings } from "../types";
import {
  isRecord,
  readStoredJson,
  readString,
  writeStoredJson,
  type StorageLike,
} from "./browserStorage";

const settingsStorageKey = "koutuhi.employeeSettings.v1";

export function loadEmployeeSettings(
  defaults: EmployeeSettings,
  storage?: StorageLike | null,
): EmployeeSettings {
  const parsed = readStoredJson(settingsStorageKey, storage);
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
  storage?: StorageLike | null,
): void {
  writeStoredJson(settingsStorageKey, settings, storage);
}
