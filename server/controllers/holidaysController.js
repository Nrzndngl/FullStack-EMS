import { getHolidays } from "../constants/holidays.js";

export const listHolidays = (req, res) => {
    const requested = parseInt(req.query.year, 10);
    const now = new Date().getFullYear();
    const year = Number.isInteger(requested) ? Math.min(2200, Math.max(1900, requested)) : now;
    return res.json({ data: getHolidays(year), reference: true });
};