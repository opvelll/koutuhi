import type { SuicaRecord } from "../types";

const transportKinds = [
  "＊入",
  "幹入",
  "幹出",
  "特典",
  "物販",
  "バス等",
  "オート",
  "現金",
  "購",
  "精",
  "定",
  "繰",
  "入",
  "出",
];

const kindPattern = transportKinds.join("|");
const yenPattern = "[\\\\¥][\\d,]+";

const busPattern = new RegExp(
  `^(\\d{1,2})\\s+(\\d{1,2})\\s+` +
    `(バス等|ﾊﾞｽ等)\\s+` +
    `(.+?)\\s+` +
    `(?:(${yenPattern})\\s+)?` +
    `([+-][\\d,]+)\\s*$`,
);

const transportPattern = new RegExp(
  `^(\\d{1,2})\\s+(\\d{1,2})\\s+` +
    `(${kindPattern})\\s+` +
    `(.+?)\\s+` +
    `(${kindPattern})\\s+` +
    `(.+?)\\s+` +
    `(?:(${yenPattern})\\s+)?` +
    `([+-][\\d,]+)`,
);

const otherWithBalancePattern = new RegExp(
  `^(\\d{1,2})\\s+(\\d{1,2})\\s+` +
    `(\\S+)\\s+` +
    `(${yenPattern})\\s*` +
    `([+-][\\d,]+)?`,
);

const otherWithAmountPattern = new RegExp(
  `^(\\d{1,2})\\s+(\\d{1,2})\\s+` +
    `(\\S+)` +
    `(?:\\s+.*?)?\\s+` +
    `([+-][\\d,]+)\\s*$`,
);

export function extractHistoryDate(text: string): string {
  const slashDate = text.match(/(\d{4}\/\d{1,2}\/\d{1,2})/);
  if (slashDate) {
    return slashDate[1];
  }

  const jpDate = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (!jpDate) {
    return "";
  }

  const [, year, month, day] = jpDate;
  return `${year}/${Number(month)}/${Number(day)}`;
}

export function parseSuicaHistoryText(lines: string[]): SuicaRecord[] {
  const records: SuicaRecord[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/^\uFEFF/, "").trim();
    if (!line) {
      continue;
    }

    const bus = line.match(busPattern);
    if (bus) {
      const [, month, day, type1, operator, balance = "0", amount] = bus;
      records.push(
        createRecord(records.length, {
          month,
          day,
          type1: type1.normalize("NFKC"),
          station1: operator,
          type2: "",
          station2: "",
          balance,
          amount,
        }),
      );
      continue;
    }

    const transport = line.match(transportPattern);
    if (transport) {
      const [
        ,
        month,
        day,
        type1,
        station1,
        type2,
        station2,
        balance = "0",
        amount,
      ] = transport;
      records.push(
        createRecord(records.length, {
          month,
          day,
          type1,
          station1,
          type2,
          station2,
          balance,
          amount,
        }),
      );
      continue;
    }

    const otherWithBalance = line.match(otherWithBalancePattern);
    if (otherWithBalance) {
      const [, month, day, type1, balance, amount = "0"] = otherWithBalance;
      records.push(
        createRecord(records.length, {
          month,
          day,
          type1,
          station1: "",
          type2: "",
          station2: "",
          balance,
          amount,
        }),
      );
      continue;
    }

    const otherWithAmount = line.match(otherWithAmountPattern);
    if (otherWithAmount) {
      const [, month, day, type1, amount] = otherWithAmount;
      records.push(
        createRecord(records.length, {
          month,
          day,
          type1,
          station1: "",
          type2: "",
          station2: "",
          balance: "0",
          amount,
        }),
      );
    }
  }

  return records;
}

export function addYearToDates(
  records: SuicaRecord[],
  reportDate: string,
): SuicaRecord[] {
  if (records.length === 0 || !reportDate) {
    return records;
  }

  const [reportYearRaw, reportMonthRaw] = reportDate.split("/");
  const reportYear = Number(reportYearRaw);
  const reportMonth = Number(reportMonthRaw);
  const firstMonth = Number(records[0].month);
  let currentYear = firstMonth > reportMonth ? reportYear - 1 : reportYear;
  let previousMonth = firstMonth;

  return records.map((record) => {
    const month = Number(record.month);
    if (month < previousMonth) {
      currentYear += 1;
    }
    previousMonth = month;

    return {
      ...record,
      date: `${currentYear}/${record.month}/${record.day}`,
    };
  });
}

type RawRecord = {
  month: string;
  day: string;
  type1: string;
  station1: string;
  type2: string;
  station2: string;
  balance: string;
  amount: string;
};

function createRecord(index: number, raw: RawRecord): SuicaRecord {
  const month = raw.month.padStart(2, "0");
  const day = raw.day.padStart(2, "0");
  const station1 = raw.station1.trim();
  const station2 = raw.station2.trim();
  const selectable =
    (station1.length > 0 && station2.length > 0) ||
    raw.type1.normalize("NFKC") === "バス等";

  return {
    id: `${index}-${month}-${day}-${raw.type1}-${station1}-${station2}`,
    date: `${month}/${day}`,
    month,
    day,
    type1: raw.type1.trim(),
    station1,
    type2: raw.type2.trim(),
    station2,
    amount: parseSignedNumber(raw.amount || "0"),
    balance: parseYenNumber(raw.balance),
    selected: selectable,
    selectable,
  };
}

function parseSignedNumber(value: string): number {
  const normalized = value.replaceAll(",", "").trim();
  return Number(normalized || "0");
}

function parseYenNumber(value: string): number {
  const normalized = value.replace(/[\\¥,]/g, "").trim();
  return Number(normalized || "0");
}
