import { adToBs } from "@sonill/nepali-dates";

const TZ = "Asia/Kathmandu";

const dateFmt = (opts) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });

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
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  const { year, month, day } = adToBs(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return `${BS_MONTHS[month - 1]} ${day}, ${year} BS`;
}

export function formatDisplayDate(value) {
  return getCalendarPref() ? formatBSDate(value) : formatNepalDate(value);
}

export function todayDisplay() {
  return getCalendarPref() ? formatBSDate(new Date()) : todayInNepal();
}
