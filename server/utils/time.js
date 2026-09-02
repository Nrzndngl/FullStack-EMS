// Nepal timezone (Asia/Kathmandu, UTC+5:45) helpers.
// Dates are normalized to *UTC midnight of the Nepal calendar date* so queries
// are timezone-independent regardless of where the server is hosted.

const TZ = "Asia/Kathmandu";
const DAY_MS = 24 * 60 * 60 * 1000;

const keyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const timeFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
});

/** "YYYY-MM-DD" wall-clock date in Nepal for the given Date (defaults to now). */
export function nepalDateKey(date = new Date()) {
    return keyFmt.format(date);
}

/** UTC-midnight Date for the Nepal calendar date (timestamp-independent grouping). */
export function startOfNepalDay(date = new Date()) {
    const [y, m, d] = nepalDateKey(date).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d));
}

/** Day after startOfNepalDay (exclusive upper bound). */
export function endOfNepalDay(date = new Date()) {
    return new Date(startOfNepalDay(date).getTime() + DAY_MS);
}

/** { start, end } UTC bounds for a "YYYY-MM-DD" date key. */
export function dayRangeForDateKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d));
    return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** { start, end } UTC bounds for today in Nepal. */
export function nepalTodayRange(date = new Date()) {
    return dayRangeForDateKey(nepalDateKey(date));
}

/** Current wall-clock { hour, minute } in Nepal. */
export function nepalNowTime(date = new Date()) {
    const [hour, minute] = timeFmt.format(date).split(":").map(Number);
    return { hour, minute };
}

/** { year, month } (month 1-based) currently in Nepal. */
export function nepalYearMonth(date = new Date()) {
    const [y, m] = nepalDateKey(date).split("-").map(Number);
    return { year: y, month: m };
}

/** { start, end } UTC bounds for a Gregorian month (month is 1-based). */
export function monthRangeForYearMonth(year, month) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { start, end };
}

/** True if the given Date falls on a Nepal wall-clock date strictly after today. */
export function isFutureInNepal(date) {
    return nepalDateKey(date) > nepalDateKey();
}

/** Inclusive number of Nepal days between two "YYYY-MM-DD" keys (end must be >= start). */
export function daysBetweenNepalKeys(startKey, endKey) {
    const [sy, sm, sd] = startKey.split("-").map(Number);
    const [ey, em, ed] = endKey.split("-").map(Number);
    const start = Date.UTC(sy, sm - 1, sd);
    const end = Date.UTC(ey, em - 1, ed);
    return Math.round((end - start) / DAY_MS) + 1;
}