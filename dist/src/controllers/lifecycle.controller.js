"use strict";
/**
 * Lifecycle Governance API Controller
 *
 * GET /api/ai-systems/[id]/lifecycle - Get lifecycle stage and history
 * PUT /api/ai-systems/[id]/lifecycle - Update lifecycle stage
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLifecycle = getLifecycle;
exports.updateLifecycle = updateLifecycle;
const server_1 = require("../../utils/supabase/server");
const auth_1 = require("../../middleware/auth");
const lifecycle_governance_rules_1 = require("../../services/governance/lifecycle-governance-rules");
const governance_tasks_1 = require("../../services/governance/governance-tasks");
const LIFECYCLE_STAGES = ['Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'];
/**
 * GET /api/ai-systems/[id]/lifecycle - Retrieve lifecycle stage and history for an AI system
 */
async function getLifecycle(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id: systemId } = req.params;
        const supabase = await (0, server_1.createClient)();
        // Lifecycle governance is ONLY for EU AI Act assessments
        const { data: euSystem, error: euError } = await supabase
            .from("eu_ai_act_check_results")
            .select("lifecycle_stage")
            .eq("id", systemId)
            .maybeSingle();
        if (euError) {
            console.error("Error fetching EU AI Act system:", euError);
        }
        // If not an EU AI Act system, return null lifecycle (feature not applicable)
        if (!euSystem) {
            return res.status(200).json({
                lifecycle_stage: null,
                history: [],
                message: "Lifecycle governance is only available for EU AI Act assessments",
            });
        }
        const lifecycleStage = euSystem?.lifecycle_stage || 'Draft';
        // Fetch lifecycle history
        const { data: history, error: historyError } = await supabase
            .from("lifecycle_history")
            .select("*")
            .eq("ai_system_id", systemId)
            .order("changed_at", { ascending: false })
            .limit(10);
        if (historyError) {
            console.error("Error fetching lifecycle history:", historyError);
        }
        return res.status(200).json({
            lifecycle_stage: lifecycleStage,
            history: history || [],
        });
    }
    catch (error) {
        console.error("GET /api/ai-systems/[id]/lifecycle error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
/**
 * PUT /api/ai-systems/[id]/lifecycle - Update lifecycle stage for an AI system
 */
async function updateLifecycle(req, res) {
    try {
        const userId = await (0, auth_1.getUserId)(req);
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const { id: systemId } = req.params;
        const body = req.body;
        const supabase = await (0, server_1.createClient)();
        // Validate lifecycle_stage
        if (!body.lifecycle_stage) {
            return res.status(400).json({ error: "lifecycle_stage is required" });
        }
        if (!LIFECYCLE_STAGES.includes(body.lifecycle_stage)) {
            return res.status(400).json({
                error: `Invalid lifecycle_stage. Must be one of: ${LIFECYCLE_STAGES.join(', ')}`
            });
        }
        // Lifecycle governance is ONLY for EU AI Act assessments
        const { data: euSystem, error: euError } = await supabase
            .from("eu_ai_act_check_results")
            .select("*")
            .eq("id", systemId)
            .maybeSingle();
        if (euError || !euSystem) {
            return res.status(400).json({
                error: "Lifecycle governance is only available for EU AI Act assessments. This system is not an EU AI Act assessment.",
                system_type: "Not EU AI Act"
            });
        }
        const previousStage = (euSystem.lifecycle_stage || 'Draft');
        const newStage = body.lifecycle_stage;
        // If stage hasn't changed, return early
        if (previousStage === newStage) {
            return res.status(200).json({
                message: "Lifecycle stage unchanged",
                lifecycle_stage: newStage,
            });
        }
        // Fetch compliance data for validation (EU AI Act only)
        const complianceData = {
            type: 'EU AI Act',
            accountable_person: euSystem.accountable_person,
        };
        // Fetch risk assessment summary
        const { data: riskAssessments } = await supabase
            .from("risk_assessments")
            .select("status")
            .eq("ai_system_id", systemId);
        const riskSummary = {
            total: riskAssessments?.length || 0,
            approved: riskAssessments?.filter((r) => r.status === 'approved').length || 0,
            submitted: riskAssessments?.filter((r) => r.status === 'submitted').length || 0,
            draft: riskAssessments?.filter((r) => r.status === 'draft').length || 0,
        };
        // Governance To-Do: enforce blocking tasks before lifecycle changes
        const blockingTasks = await (0, governance_tasks_1.getBlockingTasks)(systemId);
        if (blockingTasks.length > 0) {
            return res.status(400).json({
                error: "Lifecycle transition blocked by open governance tasks",
                blocking_tasks: blockingTasks,
            });
        }
        // Validate lifecycle transition BEFORE updating
        const validation = await (0, lifecycle_governance_rules_1.validateLifecycleTransition)(previousStage, newStage, complianceData, riskSummary);
        if (!validation.valid) {
            return res.status(400).json({
                error: "Lifecycle transition not allowed",
                reason: validation.reason,
                warnings: validation.warnings,
            });
        }
        // Update lifecycle stage (EU AI Act only)
        const updateResult = await supabase
            .from("eu_ai_act_check_results")
            .update({ lifecycle_stage: newStage })
            .eq("id", systemId)
            .select()
            .single();
        if (updateResult?.error) {
            console.error("Error updating lifecycle stage:", updateResult.error);
            return res.status(500).json({
                error: "Failed to update lifecycle stage",
                details: updateResult.error.message
            });
        }
        // Auto-trigger automated risk assessment if major change detected
        void (async () => {
            try {
                const { autoTriggerRiskAssessmentIfMajorChange } = await Promise.resolve().then(() => __importStar(require("../../services/governance/major-change-detection")));
                await autoTriggerRiskAssessmentIfMajorChange(systemId, { lifecycle_stage: previousStage, updated_at: euSystem.updated_at }, { lifecycle_stage: newStage });
            }
            catch (err) {
                console.error(`[Lifecycle] Failed to trigger risk assessment for system ${systemId}:`, err.message || err);
            }
        })();
        // Create audit trail entry
        const { error: historyError } = await supabase
            .from("lifecycle_history")
            .insert({
            ai_system_id: systemId,
            previous_stage: previousStage,
            new_stage: newStage,
            changed_by: userId,
            change_reason: body.change_reason || null,
        });
        if (historyError) {
            console.error("Error creating lifecycle history:", historyError);
            // Don't fail the request if history creation fails
        }
        // Re-evaluate governance tasks for the new lifecycle stage (EU only)
        await (0, governance_tasks_1.evaluateGovernanceTasks)(systemId);
        return res.status(200).json({
            message: "Lifecycle stage updated successfully",
            lifecycle_stage: newStage,
            previous_stage: previousStage,
            warnings: validation.warnings,
        });
    }
    catch (error) {
        console.error("PUT /api/ai-systems/[id]/lifecycle error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message
        });
    }
}
//# sourceMappingURL=lifecycle.controller.js.map