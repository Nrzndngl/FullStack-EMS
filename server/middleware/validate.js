/**
 * Express middleware that validates req.body against a zod schema.
 * On failure responds 400 with per-field error messages and does not call next().
 */
export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const details = result.error.issues
            .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
            .join("; ");
        return res.status(400).json({ error: details });
    }
    req.body = result.data;
    next();
};