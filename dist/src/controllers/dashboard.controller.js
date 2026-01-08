"use strict";
/**
 * Dashboard API Controller
 *
 * POST /api/dashboard/insights - Provides RAG-powered insights for compliance dashboards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardInsightsHandler = getDashboardInsightsHandler;
exports.getSystemInsightsHandler = getSystemInsightsHandler;
const dashboard_insights_1 = require("../../services/dashboard/dashboard-insights");
/**
 * POST /api/dashboard/insights
 * Provides RAG-powered insights for compliance dashboards
 */
async function getDashboardInsightsHandler(req, res) {
    try {
        const body = req.body;
        const { systemsData, regulationType = 'EU' } = body;
        // Validate required parameters
        if (!systemsData || !Array.isArray(systemsData)) {
            return res.status(400).json({ error: "Systems data array is required" });
        }
        // Validate regulation type if provided
        if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
            return res.status(400).json({ error: "Invalid regulation type" });
        }
        // Get insights from RAG service
        const insights = await (0, dashboard_insights_1.getDashboardInsights)(systemsData, regulationType);
        return res.json(insights);
    }
    catch (error) {
        console.error("Error getting dashboard insights:", error);
        return res.status(500).json({ error: "Failed to get dashboard insights" });
    }
}
/**
 * POST /api/dashboard/system-insights
 * Provides RAG-powered insights for individual systems
 */
async function getSystemInsightsHandler(req, res) {
    try {
        const body = req.body;
        const { systemData, regulationType = 'EU' } = body;
        // Validate required parameters
        if (!systemData) {
            return res.status(400).json({ error: "System data is required" });
        }
        // Validate regulation type if provided
        if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
            return res.status(400).json({ error: "Invalid regulation type" });
        }
        // Get insights from RAG service
        const insights = await (0, dashboard_insights_1.getSystemInsights)(systemData, regulationType);
        return res.json(insights);
    }
    catch (error) {
        console.error("Error getting system insights:", error);
        return res.status(500).json({ error: "Failed to get system insights" });
    }
}
//# sourceMappingURL=dashboard.controller.js.map