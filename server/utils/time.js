// Nepal timezone (Asia/Kathmandu, UTC+5:45) helpers.
// Dates are normalized to *UTC midnight of the Nepal calendar date* so queries
// are timezone-independent regardless of where the server is hosted.

const TZ = "Asia/Kathmandu";
const DAY_MS = 24 * 60 * 60 * 1000;

// Office shift (Asia/Kathmandu wall-clock). Credited working time is the
// overlap of actual presence with this window; presence before the start or
// after the end is not credited toward the day type. Overtime is presence
// after the shift end.
export const OFFICE_SHIFT_START = "09:00";
export const OFFICE_SHIFT_END = "17:00";
export const STANDARD_HOURS = 8;
export const LATE_GRACE_MINUTES = 30;

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

/** Instant of a Nepal wall-clock "HH:MM" on a "YYYY-MM-DD" Nepal date key. */
export function nepalInstant(dateKey, hhmm) {
    return new Date(`${dateKey}T${hhmm}:00+05:45`);
}

/** True when a check-in instant is after the on-time cutoff (shift start + grace). */
export function isLateCheckIn(checkIn, dateKey = nepalDateKey(checkIn)) {
    const cutoff = nepalInstant(dateKey, OFFICE_SHIFT_START).getTime()
        + LATE_GRACE_MINUTES * 60 * 1000;
    return new Date(checkIn).getTime() > cutoff;
}

/**
 * Credited hours (overlap with the office shift), overtime (presence after the
 * shift end) and the resulting day type for a completed attendance record.
 * `dateKey` is the Nepal calendar date ("YYYY-MM-DD") the record belongs to.
 */
export function computeAttendanceMetrics(checkIn, checkOut, dateKey) {
    const shiftStart = nepalInstant(dateKey, OFFICE_SHIFT_START).getTime();
    const shiftEnd = nepalInstant(dateKey, OFFICE_SHIFT_END).getTime();
    const inTs = new Date(checkIn).getTime();
    const outTs = new Date(checkOut).getTime();

    const creditedMs = Math.max(0, Math.min(outTs, shiftEnd) - Math.max(inTs, shiftStart));
    const overtimeMs = Math.max(0, outTs - Math.max(inTs, shiftEnd));

    const workingHours = parseFloat((creditedMs / (60 * 60 * 1000)).toFixed(2));
    const overtimeHours = parseFloat((overtimeMs / (60 * 60 * 1000)).toFixed(2));

    let dayType = "Short Day";
    if (workingHours >= STANDARD_HOURS) dayType = "Full Day";
    else if (workingHours >= 6) dayType = "Three Quarter Day";
    else if (workingHours >= 4) dayType = "Half Day";

    return { workingHours, overtimeHours, dayType };
}

/** Inclusive number of Nepal days between two "YYYY-MM-DD" keys (end must be >= start). */
export function daysBetweenNepalKeys(startKey, endKey) {
    const [sy, sm, sd] = startKey.split("-").map(Number);
    const [ey, em, ed] = endKey.split("-").map(Number);
    const start = Date.UTC(sy, sm - 1, sd);
    const end = Date.UTC(ey, em - 1, ed);
    return Math.round((end - start) / DAY_MS) + 1;
}