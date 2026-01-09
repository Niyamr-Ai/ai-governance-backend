"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.periodicRiskReview = periodicRiskReview;
exports.regenerateDocumentation = regenerateDocumentation;
const supabase_1 = require("../lib/supabase");
const axios_1 = __importDefault(require("axios"));
/**
 * GET /api/cron/periodic-risk-review
 */
async function periodicRiskReview(req, res) {
    try {
        // 🔐 Verify cron secret
        const authHeader = req.headers.authorization;
        if (process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const now = new Date().toISOString();
        // ✅ Use service-role Supabase
        const { data: assessmentsDue, error } = await supabase_1.supabaseAdmin
            .from("automated_risk_assessments")
            .select("id, ai_system_id, next_review_date, review_frequency_months, monitoring_enabled")
            .eq("monitoring_enabled", true)
            .lte("next_review_date", now);
        if (error) {
            console.error("Query error:", error);
            return res.status(500).json({ error: "Database query failed" });
        }
        if (!assessmentsDue || assessmentsDue.length === 0) {
            return res.status(200).json({
                message: "No assessments due for periodic review",
                count: 0,
            });
        }
        const baseUrl = process.env.INTERNAL_API_BASE_URL || "http://localhost:3001";
        const results = [];
        for (const assessment of assessmentsDue) {
            try {
                const response = await axios_1.default.post(`${baseUrl}/api/ai-systems/${assessment.ai_system_id}/automated-risk-assessment`, {
                    trigger_type: "periodic_review",
                    previous_assessment_id: assessment.id,
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`,
                    },
                });
                results.push({
                    system_id: assessment.ai_system_id,
                    assessment_id: response.data.id,
                    status: "success",
                });
            }
            catch (err) {
                results.push({
                    system_id: assessment.ai_system_id,
                    status: "error",
                    error: err.message,
                });
            }
        }
        return res.status(200).json({
            total: assessmentsDue.length,
            success: results.filter(r => r.status === "success").length,
            errors: results.filter(r => r.status === "error").length,
            results,
        });
    }
    catch (err) {
        console.error("Periodic risk review error:", err);
        return res.status(500).json({ error: err.message });
    }
}
/**
 * POST /api/cron/regenerate-documentation
 */
async function regenerateDocumentation(req, res) {
    try {
        const cronSecret = req.headers["x-cron-secret"];
        if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { data: outdatedDocs, error } = await supabase_1.supabaseAdmin
            .from("compliance_documentation")
            .select("ai_system_id, regulation_type")
            .eq("status", "outdated");
        if (error) {
            console.error(error);
            return res.status(500).json({ error: "Failed to fetch docs" });
        }
        if (!outdatedDocs || outdatedDocs.length === 0) {
            return res.json({ regenerated: 0 });
        }
        const grouped = new Map();
        for (const doc of outdatedDocs) {
            if (!grouped.has(doc.ai_system_id)) {
                grouped.set(doc.ai_system_id, []);
            }
            grouped.get(doc.ai_system_id).push(doc.regulation_type);
        }
        let success = 0;
        let failure = 0;
        for (const [systemId, regulations] of grouped.entries()) {
            try {
                const { autoGenerateDocumentationIfNeeded, } = await Promise.resolve().then(() => __importStar(require("../../services/documentation/documentation-auto-generate")));
                await autoGenerateDocumentationIfNeeded(systemId, regulations);
                success++;
            }
            catch (err) {
                failure++;
                console.error(`Doc regen failed for ${systemId}`, err);
            }
        }
        return res.json({
            systems: grouped.size,
            regenerated: success,
            failed: failure,
        });
    }
    catch (err) {
        console.error("Cron error:", err);
        return res.status(500).json({ error: err.message });
    }
}
//# sourceMappingURL=cron.controller.js.map