"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = logger;
function logger(req, res, next) {
    const start = Date.now();
    console.log(`${req.method} ${req.originalUrl}`);
    // Override res.json to log response time
    const originalJson = res.json;
    res.json = function (data) {
        console.log(`📦 ${res.statusCode} - ${Date.now() - start}ms`);
        return originalJson.call(this, data);
    };
    next();
}
//# sourceMappingURL=index.js.map