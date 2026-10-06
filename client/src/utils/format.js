import { adToBs } from "@sonill/nepali-dates";

const TZ = "Asia/Kathmandu";

const dateFmt = (opts) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });

const toDate = (value) =>
  typeof value === "string" || typeof value === "number" ? new Date(value) : value;

const nepalYMD = (value = new Date()) => {
  const date = toDate(value);
  if (!date || isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value);
  const year = get("year");
  const month = get("month");
  const day = get("day");
  if (!year || !month || !day) return null;
  return { year, month, day };
};

export function nepalDateParts(value) {
  return nepalYMD(value);
}

export function nepalDateKey(value = new Date()) {
  const parts = nepalYMD(value);
  if (!parts) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function nepalMonthStartKey(value = new Date()) {
  const parts = nepalYMD(value);
  if (!parts) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${parts.year}-${pad(parts.month)}-01`;
}

export function todayNepalKey() {
  return nepalDateKey(new Date());
}

export function dateFromNepalKey(key) {
  if (!key) return null;
  const date = new Date(`${key}T00:00:00+05:45`);
  return isNaN(date.getTime()) ? null : date;
}

export function shiftNepalKey(key, days) {
  const parts = nepalYMD(dateFromNepalKey(key));
  if (!parts) return key;
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  const pad = (n) => String(n).padStart(2, "0");
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function formatNepalDate(value, opts = {}) {
  if (!value) return "—";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  const { year = "numeric", month = "short", day = "numeric", weekday } = opts;
  return dateFmt({ year, month, day, weekday }).format(date);
}

export function formatNepalTime(value, opts = {}) {
  if (!value) return "—";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  return dateFmt({ hour: "numeric", minute: "2-digit", ...opts }).format(date);
}

export function formatNepalDateTime(value) {
  if (!value) return "—";
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  return dateFmt({ year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function todayInNepal() {
  const now = new Date();
  const parts = dateFmt({ year: "numeric", month: "long", day: "numeric", weekday: "long" }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get("weekday")}, ${get("month")} ${get("day")}, ${get("year")}`;
}

const nprFmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "NPR", maximumFractionDigits: 0 });

export function formatNPR(value) {
  if (value == null || isNaN(Number(value))) return "—";
  return nprFmt.format(Number(value));
}

/* ---------- Bikram Sambat (BS) display ---------- */

const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

export const getCalendarPref = () => typeof window !== "undefined" && window.localStorage.getItem("calendar") === "bs";
export const setCalendarPref = (enabled) => window.localStorage.setItem("calendar", enabled ? "bs" : "ad");

export function formatBSDate(value) {
  if (!value) return "—";
  const parts = nepalYMD(value);
  if (!parts) return "—";
  let bs;
  try {
    bs = adToBs(parts.year, parts.month, parts.day);
  } catch {
    return "—";
  }
  return `${BS_MONTHS[bs.month - 1]} ${bs.day}, ${bs.year} BS`;
}

export function formatDisplayDate(value) {
  return getCalendarPref() ? formatBSDate(value) : formatNepalDate(value);
}

export function todayDisplay() {
  return getCalendarPref() ? formatBSDate(new Date()) : todayInNepal();
}
