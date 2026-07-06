export type ExtractStatus =
  | "idle"
  | "extracting"
  | "ready"
  | "ocr-ready"
  | "ocr-running"
  | "generating"
  | "error";

export type SuicaRecord = {
  id: string;
  date: string;
  month: string;
  day: string;
  type1: string;
  station1: string;
  type2: string;
  station2: string;
  amount: number;
  balance: number;
  selected: boolean;
  selectable: boolean;
};

export type CommuteEntry = {
  date: string;
  route: string;
  roundTripFare: number;
};

export type EmployeeSettings = {
  branch: string;
  employeeId: string;
  name: string;
};

export type GeneratedWorkbook = {
  fileName: string;
  blob: Blob;
};

