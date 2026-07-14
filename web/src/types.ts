export type ExtractStatus =
  | "idle"
  | "extracting"
  | "ready"
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
  id: string;
  date: string;
  route: string;
  routeKey: string;
  roundTripFare: number;
  selected: boolean;
  companyName: string;
  workLocation: string;
};

export type EmployeeSettings = {
  branch: string;
  employeeId: string;
  name: string;
};

export type RouteProfile = {
  companyName: string;
  workLocation: string;
  updatedAt: string;
};

export type RouteProfileMap = Record<string, RouteProfile>;

export type GeneratedWorkbook = {
  fileName: string;
  blob: Blob;
};
