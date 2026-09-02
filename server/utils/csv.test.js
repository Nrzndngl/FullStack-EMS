import { describe, it, expect } from "vitest";
import { toCSV } from "./csv.js";

describe("toCSV", () => {
    it("writes a header and rows", () => {
        const csv = toCSV(["name", "age"], [["Ram", "30"], ["Sita", "28"]]);
        expect(csv).toBe("name,age\r\nRam,30\r\nSita,28");
    });
    it("escapes commas, quotes and newlines", () => {
        const csv = toCSV(["note"], [[`say "hi", ok`]]);
        expect(csv).toContain('"say ""hi"", ok"');
    });
    it("handles null/undefined as empty cells", () => {
        const csv = toCSV(["a", "b"], [[null, undefined]]);
        expect(csv.split("\r\n")[1]).toBe(",");
    });
});