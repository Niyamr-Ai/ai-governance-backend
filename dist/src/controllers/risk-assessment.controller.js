"use strict";
/**
 * Risk Assessment API Controller
 *
 * POST /api/risk-assessment/field-guidance - Provides targeted guidance for specific form fields
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFieldGuidanceHandler = getFieldGuidanceHandler;
exports.getGuidanceHandler = getGuidanceHandler;
const guidance_1 = require("../../services/risk-assessment/guidance");
/**
 * POST /api/risk-assessment/field-guidance - Provides targeted guidance for specific form fields
 */
async function getFieldGuidanceHandler(req, res) {
    try {
        const body = req.body;
        const { field, category, riskLevel } = body;
        // Validate required parameters
        if (!field || !category) {
            return res.status(400).json({ error: "Field and category are required" });
        }
        // Validate category
        const validCategories = ['bias', 'robustness', 'privacy', 'explainability'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: "Invalid category" });
        }
        // Validate risk level if provided
        if (riskLevel && !['low', 'medium', 'high'].includes(riskLevel)) {
            return res.status(400).json({ error: "Invalid risk level" });
        }
        // Get field guidance
        const guidance = await (0, guidance_1.getFieldGuidance)(field, category, riskLevel);
        return res.json({ guidance });
    }
    catch (error) {
        console.error("Error getting field guidance:", error);
        return res.status(500).json({ error: "Failed to get field guidance" });
    }
}
/**
 * POST /api/risk-assessment/guidance - Provides RAG-powered guidance for risk assessment forms
 */
async function getGuidanceHandler(req, res) {
    try {
        const body = req.body;
        const { category, riskLevel, regulationType, systemContext } = body;
        // Validate required parameters
        if (!category) {
            return res.status(400).json({ error: "Category is required" });
        }
        // Validate category
        const validCategories = ['bias', 'robustness', 'privacy', 'explainability'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ error: "Invalid category" });
        }
        // Validate risk level if provided
        if (riskLevel && !['low', 'medium', 'high'].includes(riskLevel)) {
            return res.status(400).json({ error: "Invalid risk level" });
        }
        // Validate regulation type if provided
        if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
            return res.status(400).json({ error: "Invalid regulation type" });
        }
        // Get guidance from RAG service
        const guidance = await (0, guidance_1.getRiskAssessmentGuidance)(category, riskLevel, regulationType, systemContext);
        return res.json(guidance);
    }
    catch (error) {
        console.error("Error getting risk assessment guidance:", error);
        return res.status(500).json({ error: "Failed to get guidance" });
    }
}
//# sourceMappingURL=risk-assessment.controller.js.map