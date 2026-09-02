const escapeCell = (value) => {
    const str = value == null ? "" : String(value);
    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
};

export const toCSV = (headers, rows) => {
    const lines = [headers.map(escapeCell).join(",")];
    for (const row of rows) {
        lines.push(row.map(escapeCell).join(","));
    }
    return lines.join("\r\n");
};

export const csvResponse = (res, filename, csv) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(csv);
};