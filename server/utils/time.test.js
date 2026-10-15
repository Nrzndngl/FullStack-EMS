import { describe, it, expect } from "vitest";
import {
    nepalDateKey,
    startOfNepalDay,
    dayRangeForDateKey,
    nepalNowTime,
    daysBetweenNepalKeys,
    isFutureInNepal,
    nepalInstant,
    isLateCheckIn,
    computeAttendanceMetrics,
} from "./time.js";

describe("nepalDateKey", () => {
    it("converts an instant to the Kathmandu wall-clock date", () => {
        // 18:59:59Z = 23:59:59 in Kathmandu (UTC+5:45)
        expect(nepalDateKey(new Date("2026-09-02T18:14:59Z"))).toBe("2026-09-02");
        // 18:15:00Z = 00:00:00 next day in Kathmandu
        expect(nepalDateKey(new Date("2026-09-02T18:15:00Z"))).toBe("2026-09-03");
    });
});

describe("startOfNepalDay", () => {
    it("normalizes to UTC midnight of the Nepal date", () => {
        const start = startOfNepalDay(new Date("2026-09-02T06:15:00Z"));
        expect(start.toISOString()).toBe("2026-09-02T00:00:00.000Z");
    });
});

describe("dayRangeForDateKey", () => {
    it("returns an exclusive next-day bound", () => {
        const { start, end } = dayRangeForDateKey("2026-09-02");
        expect(start.toISOString()).toBe("2026-09-02T00:00:00.000Z");
        expect(end.toISOString()).toBe("2026-09-03T00:00:00.000Z");
    });
});

describe("nepalNowTime", () => {
    it("returns a valid hour/minute pair", () => {
        const { hour, minute } = nepalNowTime(new Date("2026-09-02T06:15:00Z"));
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThanOrEqual(23);
        expect(minute).toBeGreaterThanOrEqual(0);
        expect(minute).toBeLessThan(60);
    });
});

describe("daysBetweenNepalKeys", () => {
    it("counts a single day as 1", () => {
        expect(daysBetweenNepalKeys("2026-09-02", "2026-09-02")).toBe(1);
    });
    it("counts inclusive multi-day ranges", () => {
        expect(daysBetweenNepalKeys("2026-09-02", "2026-09-05")).toBe(4);
    });
    it("counts across month boundaries", () => {
        expect(daysBetweenNepalKeys("2026-09-30", "2026-10-02")).toBe(3);
    });
});

describe("isFutureInNepal", () => {
    it("is false for today's date normalized", () => {
        const todayStart = startOfNepalDay();
        expect(isFutureInNepal(todayStart)).toBe(false);
    });
    it("is true for a date far in the future", () => {
        expect(isFutureInNepal(new Date("2099-01-01T00:00:00Z"))).toBe(true);
    });
});

describe("nepalInstant", () => {
    it("maps a Nepal wall-clock time to the correct UTC instant", () => {
        expect(nepalInstant("2026-09-02", "09:00").toISOString()).toBe("2026-09-02T03:15:00.000Z");
        expect(nepalInstant("2026-09-02", "17:00").toISOString()).toBe("2026-09-02T11:15:00.000Z");
    });
});

describe("isLateCheckIn", () => {
    // Nepal 09:00 = 03:15Z; grace is 30 minutes so 09:30 = 03:45Z is the cutoff.
    it("is on time up to and including the grace cutoff", () => {
        expect(isLateCheckIn(new Date("2026-09-02T03:15:00Z"))).toBe(false);
        expect(isLateCheckIn(new Date("2026-09-02T03:45:00Z"))).toBe(false);
    });
    it("is late after the grace cutoff", () => {
        expect(isLateCheckIn(new Date("2026-09-02T03:46:00Z"))).toBe(true);
    });
});

describe("computeAttendanceMetrics", () => {
    const key = "2026-09-02"; // Nepal 09:00 = 03:15Z, 17:00 = 11:15Z
    it("credits a full shift as 8 hours / Full Day", () => {
        const m = computeAttendanceMetrics(
            new Date("2026-09-02T03:15:00Z"),
            new Date("2026-09-02T11:15:00Z"),
            key
        );
        expect(m).toEqual({ workingHours: 8, overtimeHours: 0, dayType: "Full Day" });
    });
    it("downgrades a late arrival inside the shift window", () => {
        const m = computeAttendanceMetrics(
            new Date("2026-09-02T03:45:00Z"), // 09:30 -> 7.5 credited hours
            new Date("2026-09-02T11:15:00Z"),
            key
        );
        expect(m.workingHours).toBe(7.5);
        expect(m.dayType).toBe("Three Quarter Day");
    });
    it("ignores presence outside the shift but counts evening overtime", () => {
        const m = computeAttendanceMetrics(
            new Date("2026-09-02T02:15:00Z"), // 08:00, before shift
            new Date("2026-09-02T13:15:00Z"), // 19:00, two hours overtime
            key
        );
        expect(m).toEqual({ workingHours: 8, overtimeHours: 2, dayType: "Full Day" });
    });
    it("returns a Short Day for under four credited hours", () => {
        const m = computeAttendanceMetrics(
            new Date("2026-09-02T03:15:00Z"),
            new Date("2026-09-02T05:15:00Z"), // 09:00-11:00
            key
        );
        expect(m.workingHours).toBe(2);
        expect(m.dayType).toBe("Short Day");
    });
});