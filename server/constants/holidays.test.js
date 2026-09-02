import { describe, it, expect } from "vitest";
import { getHolidays } from "./holidays.js";

describe("getHolidays", () => {
    it("returns a list with date and name for 2026", () => {
        const holidays = getHolidays(2026);
        expect(holidays.length).toBeGreaterThan(5);
        expect(holidays[0]).toMatchObject({ date: "2026-01-15", name: "Maghe Sankranti" });
    });
    it("returns dates in YYYY-MM-DD format", () => {
        for (const h of getHolidays(2026)) {
            expect(h.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });
    it("returns an empty list for unknown years instead of crashing", () => {
        expect(getHolidays(1990)).toEqual([]);
    });
});