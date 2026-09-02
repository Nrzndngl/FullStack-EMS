/**
 * Reference list of Nepal public holidays with approximate Gregorian dates.
 * NOTE: Nepali festival dates shift slightly each year; this is a curated
 * reference, not an authoritative calendar. Verify against the official
 * Nepali calendar before relying on it for scheduling.
 */
const HOLIDAYS_2026 = [
    { month: 1, day: 15, name: "Maghe Sankranti" },
    { month: 2, day: 16, name: "Sonam Lhosar" },
    { month: 3, day: 3, name: "Maha Shivaratri" },
    { month: 3, day: 15, name: "Holi / Fagu Purnima" },
    { month: 4, day: 14, name: "Nepali New Year" },
    { month: 5, day: 24, name: "Buddha Jayanti" },
    { month: 8, day: 29, name: "Raksha Bandhan" },
    { month: 9, day: 5, name: "Krishna Janmashtami" },
    { month: 9, day: 21, name: "Constitution Day (Nepal)" },
    { month: 10, day: 19, name: "Dashain (Ghatasthapana)" },
    { month: 10, day: 22, name: "Dashain (Fulpati)" },
    { month: 10, day: 24, name: "Dashain (Vijaya Dashami)" },
    { month: 11, day: 9, name: "Tihar (Laxmi Puja)" },
    { month: 11, day: 11, name: "Tihar (Bhai Tika)" },
    { month: 11, day: 16, name: "Chhath Parba" },
];

const HOLIDAYS_2027 = [
    { month: 1, day: 15, name: "Maghe Sankranti" },
    { month: 2, day: 4, name: "Sonam Lhosar" },
    { month: 3, day: 20, name: "Holi / Fagu Purnima" },
    { month: 4, day: 14, name: "Nepali New Year" },
    { month: 5, day: 13, name: "Buddha Jayanti" },
    { month: 9, day: 21, name: "Constitution Day (Nepal)" },
    { month: 10, day: 9, name: "Dashain (Ghatasthapana)" },
    { month: 10, day: 14, name: "Dashain (Vijaya Dashami)" },
    { month: 10, day: 29, name: "Tihar (Laxmi Puja)" },
    { month: 10, day: 31, name: "Tihar (Bhai Tika)" },
    { month: 11, day: 5, name: "Chhath Parba" },
];

const byYear = {
    2026: HOLIDAYS_2026,
    2027: HOLIDAYS_2027,
};

export const getHolidays = (year = new Date().getFullYear()) => {
    const list = byYear[year] || [];
    return list.map((h) => ({
        date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
        name: h.name,
    }));
};