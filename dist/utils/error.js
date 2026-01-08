"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
// utils/error.ts
const zod_1 = require("zod");
/** Express error handler middleware */
function errorHandler(err, req, res, next) {
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.issues
        });
    }
    // Knex/Postgres unique violation
    if (err?.code === "23505") {
        const detail = err.detail || "Duplicate record";
        return res.status(409).json({ error: detail });
    }
    // Foreign key violation or other constraint error
    if (err?.code === "23503") {
        const detail = err.detail || "Foreign key constraint failed";
        return res.status(400).json({ error: detail });
    }
    console.error("[Unhandled Error]", err);
    return res.status(500).json({ error: "Internal server error" });
}
/** Higher-order function to wrap async route handlers */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=error.js.map