"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cron_controller_1 = require("../controllers/cron.controller");
const router = (0, express_1.Router)();
// GET /api/cron/periodic-risk-review
router.get('/periodic-risk-review', cron_controller_1.periodicRiskReview);
// GET /api/cron/regenerate-documentation
router.get('/regenerate-documentation', cron_controller_1.regenerateDocumentation);
// POST /api/cron/regenerate-documentation (alternative method)
router.post('/regenerate-documentation', cron_controller_1.regenerateDocumentation);
exports.default = router;
//# sourceMappingURL=cron.routes.js.map