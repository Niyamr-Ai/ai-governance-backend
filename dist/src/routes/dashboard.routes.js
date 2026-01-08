"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// POST /api/dashboard/insights
router.post('/insights', dashboard_controller_1.getDashboardInsightsHandler);
// POST /api/dashboard/system-insights
router.post('/system-insights', dashboard_controller_1.getSystemInsightsHandler);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map