import { describe, it, expect } from "vitest";
import {
    loginSchema,
    createLeaveSchema,
    createEmployeeSchema,
    createPayslipSchema,
} from "./index.js";

describe("loginSchema", () => {
    it("accepts valid credentials", () => {
        const r = loginSchema.safeParse({ email: "a@b.com", password: "secret" });
        expect(r.success).toBe(true);
    });
    it("rejects a malformed email", () => {
        const r = loginSchema.safeParse({ email: "nope", password: "secret" });
        expect(r.success).toBe(false);
    });
    it("rejects when password is missing", () => {
        const r = loginSchema.safeParse({ email: "a@b.com" });
        expect(r.success).toBe(false);
    });
});

describe("createLeaveSchema", () => {
    it("accepts a valid leave", () => {
        const r = createLeaveSchema.safeParse({
            type: "SICK",
            startDate: "2026-10-01",
            endDate: "2026-10-02",
            reason: "Fever",
        });
        expect(r.success).toBe(true);
    });
    it("rejects an invalid type", () => {
        const r = createLeaveSchema.safeParse({
            type: "MATERNITY",
            startDate: "2026-10-01",
            endDate: "2026-10-02",
            reason: "x",
        });
        expect(r.success).toBe(false);
    });
});

describe("createEmployeeSchema", () => {
    it("rejects a short password", () => {
        const r = createEmployeeSchema.safeParse({
            firstName: "Ram",
            lastName: "Sharma",
            email: "ram@b.com",
            password: "123",
        });
        expect(r.success).toBe(false);
    });
    it("accepts a valid employee", () => {
        const r = createEmployeeSchema.safeParse({
            firstName: "Ram",
            lastName: "Sharma",
            email: "ram@b.com",
            password: "longenough1",
        });
        expect(r.success).toBe(true);
    });
});

describe("createPayslipSchema", () => {
    it("accepts a valid payslip", () => {
        const r = createPayslipSchema.safeParse({
            employeeId: "507f1f77bcf86cd799439011",
            month: 9,
            year: 2026,
            basicSalary: 50000,
        });
        expect(r.success).toBe(true);
    });
    it("rejects a month out of range", () => {
        const r = createPayslipSchema.safeParse({
            employeeId: "507f1f77bcf86cd799439011",
            month: 13,
            year: 2026,
            basicSalary: 50000,
        });
        expect(r.success).toBe(false);
    });
});