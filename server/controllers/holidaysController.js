import { getHolidays } from "../constants/holidays.js";

export const listHolidays = (req, res) => {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    return res.json({ data: getHolidays(year), reference: true });
};