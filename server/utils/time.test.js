import { describe, it, expect } from "vitest";
import {
    nepalDateKey,
    startOfNepalDay,
    dayRangeForDateKey,
    nepalNowTime,
    daysBetweenNepalKeys,
    isFutureInNepal,
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