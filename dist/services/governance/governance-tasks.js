"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateGovernanceTasks = evaluateGovernanceTasks;
exports.getBlockingTasks = getBlockingTasks;
const client_1 = require("../../src/utils/supabase/client");
const REGULATION_LABEL_MAP = {
    EU: "EU AI Act",
    UK: "UK AI Act",
    MAS: "MAS",
};
async function getSystemContext(supabase, systemId) {
    const [{ data: eu }, { data: uk }, { data: mas }] = await Promise.all([
        supabase
            .from("eu_ai_act_check_results")
            .select("*")
            .eq("id", systemId)
            .maybeSingle(),
        supabase
            .from("uk_ai_assessments")
            .select("*")
            .eq("id", systemId)
            .maybeSingle(),
        supabase
            .from("mas_ai_risk_assessments")
            .select("*")
            .eq("id", systemId)
            .maybeSingle(),
    ]);
    if (eu) {
        return {
            regulation: "EU",
            systemLabel: "EU AI Act",
            data: eu,
            lifecycle_stage: eu.lifecycle_stage || "Draft",
        };
    }
    if (uk) {
        return {
            regulation: "UK",
            systemLabel: "UK AI Act",
            data: uk,
            lifecycle_stage: uk.lifecycle_stage || null,
        };
    }
    if (mas) {
        return {
            regulation: "MAS",
            systemLabel: "MAS",
            data: mas,
            lifecycle_stage: mas.lifecycle_stage || null,
        };
    }
    return null;
}
async function getRiskAssessmentSummary(supabase, systemId) {
    const { data: assessments } = await supabase
        .from("risk_assessments")
        .select("status")
        .eq("ai_system_id", systemId);
    return {
        total: assessments?.length || 0,
        approved: assessments?.filter((r) => r.status === "approved").length || 0,
        submitted: assessments?.filter((r) => r.status === "submitted").length || 0,
        draft: assessments?.filter((r) => r.status === "draft").length || 0,
    };
}
async function hasCurrentDocumentation(supabase, systemId, regulation) {
    const { data } = await supabase
        .from("compliance_documentation")
        .select("id")
        .eq("ai_system_id", systemId)
        .eq("regulation_type", REGULATION_LABEL_MAP[regulation])
        .eq("status", "current")
        .maybeSingle();
    return Boolean(data);
}
function ukChecklistIncomplete(systemData) {
    if (!systemData)
        return true;
    const principles = [
        systemData.safety_and_security,
        systemData.transparency,
        systemData.fairness,
        systemData.governance,
        systemData.contestability,
    ].filter(Boolean);
    const anyGaps = principles.some((p) => !p.meetsPrinciple || (p.missing && p.missing.length > 0));
    return (anyGaps ||
        !systemData.overall_assessment ||
        systemData.overall_assessment !== "Compliant");
}
function masChecklistIncomplete(systemData) {
    if (!systemData)
        return true;
    const pillarStatuses = [
        systemData.governance,
        systemData.inventory,
        systemData.dataManagement,
        systemData.transparency,
        systemData.fairness,
        systemData.humanOversight,
        systemData.thirdParty,
        systemData.algoSelection,
        systemData.evaluationTesting,
        systemData.techCybersecurity,
        systemData.monitoringChange,
        systemData.capabilityCapacity,
    ].filter(Boolean);
    const anyNonCompliant = pillarStatuses.some((p) => p.status && p.status !== "Compliant");
    return (anyNonCompliant ||
        !systemData.overall_compliance_status ||
        systemData.overall_compliance_status !== "Compliant");
}
function desiredStatus(blocking) {
    return blocking ? "Blocked" : "Pending";
}
/**
 * Create or update a task (idempotent) while respecting completed immutability.
 */
async function ensureTask(supabase, existingTasks, task) {
    const existing = existingTasks.find((t) => t.ai_system_id === task.ai_system_id &&
        t.regulation === task.regulation &&
        t.title === task.title);
    if (existing) {
        if (existing.status === "Completed") {
            return;
        }
        const status = task.status || desiredStatus(task.blocking);
        const { data: updated, error } = await supabase
            .from("governance_tasks")
            .update({
            description: task.description,
            blocking: task.blocking,
            status,
            related_entity_id: task.related_entity_id || null,
            related_entity_type: task.related_entity_type || null,
        })
            .eq("id", existing.id)
            .select()
            .maybeSingle();
        if (error) {
            console.error("Failed to update governance task", error);
        }
        else if (updated) {
            const idx = existingTasks.findIndex((t) => t.id === existing.id);
            existingTasks[idx] = updated;
        }
        return;
    }
    const status = task.status || desiredStatus(task.blocking);
    const { data: inserted, error } = await supabase
        .from("governance_tasks")
        .upsert({
        ai_system_id: task.ai_system_id,
        title: task.title,
        description: task.description,
        regulation: task.regulation,
        status,
        blocking: task.blocking,
        related_entity_id: task.related_entity_id || null,
        related_entity_type: task.related_entity_type || null,
    }, { onConflict: "ai_system_id,regulation,title" })
        .select()
        .maybeSingle();
    if (error) {
        console.error("Failed to insert governance task", error);
        return;
    }
    if (inserted) {
        existingTasks.push(inserted);
    }
}
async function completeTask(supabase, existingTasks, ai_system_id, regulation, title, evidence_link) {
    const existing = existingTasks.find((t) => t.ai_system_id === ai_system_id &&
        t.regulation === regulation &&
        t.title === title);
    if (!existing || existing.status === "Completed") {
        return;
    }
    const { data: updated, error } = await supabase
        .from("governance_tasks")
        .update({
        status: "Completed",
        completed_at: new Date().toISOString(),
        evidence_link: evidence_link ?? existing.evidence_link ?? null,
    })
        .eq("id", existing.id)
        .select()
        .maybeSingle();
    if (error) {
        console.error("Failed to complete governance task", error);
        return;
    }
    if (updated) {
        const idx = existingTasks.findIndex((t) => t.id === existing.id);
        existingTasks[idx] = updated;
    }
}
async function fetchExistingTasks(supabase, systemId) {
    const { data: existing } = await supabase
        .from("governance_tasks")
        .select("*")
        .eq("ai_system_id", systemId)
        .order("created_at", { ascending: true });
    return existing || [];
}
/**
 * Evaluate governance rules and ensure tasks are created/updated.
 */
async function evaluateGovernanceTasks(systemId) {
    const context = await getSystemContext(client_1.supabase, systemId);
    if (!context) {
        return [];
    }
    const existingTasks = await fetchExistingTasks(client_1.supabase, systemId);
    const riskSummary = await getRiskAssessmentSummary(client_1.supabase, systemId);
    const documentationExists = await hasCurrentDocumentation(client_1.supabase, systemId, context.regulation);
    // Rule: No approved risk assessment
    if (riskSummary.approved === 0) {
        await ensureTask(client_1.supabase, existingTasks, {
            ai_system_id: systemId,
            regulation: context.regulation,
            title: "Obtain an approved risk assessment",
            description: "Approve at least one risk assessment to satisfy governance requirements.",
            blocking: context.regulation === "EU",
            status: context.regulation === "EU" ? "Blocked" : "Pending",
            related_entity_type: "risk_assessment",
        });
    }
    else {
        await completeTask(client_1.supabase, existingTasks, systemId, context.regulation, "Obtain an approved risk assessment");
    }
    // Rule: Documentation missing
    if (!documentationExists) {
        await ensureTask(client_1.supabase, existingTasks, {
            ai_system_id: systemId,
            regulation: context.regulation,
            title: "Generate compliance documentation",
            description: "Produce a current documentation version for this system.",
            blocking: false,
            status: "Pending",
            related_entity_type: "documentation",
        });
    }
    else {
        await completeTask(client_1.supabase, existingTasks, systemId, context.regulation, "Generate compliance documentation");
    }
    // EU lifecycle-specific checks
    if (context.regulation === "EU") {
        const lifecycleStage = (context.lifecycle_stage ||
            "Draft");
        if (lifecycleStage === "Testing" &&
            riskSummary.submitted + riskSummary.approved === 0) {
            await ensureTask(client_1.supabase, existingTasks, {
                ai_system_id: systemId,
                regulation: "EU",
                title: "Provide a completed assessment for Testing",
                description: "At least one submitted or approved risk assessment is required in Testing stage.",
                blocking: true,
                status: "Blocked",
                related_entity_type: "risk_assessment",
            });
        }
        else {
            await completeTask(client_1.supabase, existingTasks, systemId, "EU", "Provide a completed assessment for Testing");
        }
        if ((lifecycleStage === "Deployed" || lifecycleStage === "Monitoring") &&
            riskSummary.approved === 0) {
            await ensureTask(client_1.supabase, existingTasks, {
                ai_system_id: systemId,
                regulation: "EU",
                title: "Approved assessment required for Deployed/Monitoring",
                description: "Maintain at least one approved risk assessment before Deployed or Monitoring stages.",
                blocking: true,
                status: "Blocked",
                related_entity_type: "risk_assessment",
            });
        }
        else {
            await completeTask(client_1.supabase, existingTasks, systemId, "EU", "Approved assessment required for Deployed/Monitoring");
        }
        if ((lifecycleStage === "Deployed" || lifecycleStage === "Monitoring") &&
            (!context.data?.accountable_person ||
                context.data.accountable_person === "Not specified")) {
            await ensureTask(client_1.supabase, existingTasks, {
                ai_system_id: systemId,
                regulation: "EU",
                title: "Assign accountable person",
                description: "Assign an accountable person before operating in Deployed or Monitoring.",
                blocking: true,
                status: "Blocked",
            });
        }
        else {
            await completeTask(client_1.supabase, existingTasks, systemId, "EU", "Assign accountable person");
        }
    }
    // UK checklist completeness
    if (context.regulation === "UK" && ukChecklistIncomplete(context.data)) {
        await ensureTask(client_1.supabase, existingTasks, {
            ai_system_id: systemId,
            regulation: "UK",
            title: "Complete UK compliance checklist",
            description: "Address missing UK AI principles and mark checklist items as compliant.",
            blocking: false,
            status: "Pending",
        });
    }
    else if (context.regulation === "UK") {
        await completeTask(client_1.supabase, existingTasks, systemId, "UK", "Complete UK compliance checklist");
    }
    // MAS checklist completeness
    if (context.regulation === "MAS" &&
        masChecklistIncomplete(context.data)) {
        await ensureTask(client_1.supabase, existingTasks, {
            ai_system_id: systemId,
            regulation: "MAS",
            title: "Complete MAS compliance checklist",
            description: "Close out MAS AI Risk Management pillar gaps and update compliance status.",
            blocking: false,
            status: "Pending",
        });
    }
    else if (context.regulation === "MAS") {
        await completeTask(client_1.supabase, existingTasks, systemId, "MAS", "Complete MAS compliance checklist");
    }
    // Return the latest task list
    const { data: refreshed } = await client_1.supabase
        .from("governance_tasks")
        .select("*")
        .eq("ai_system_id", systemId)
        .order("created_at", { ascending: true });
    return (refreshed || []);
}
async function getBlockingTasks(systemId) {
    const tasks = await evaluateGovernanceTasks(systemId);
    return tasks.filter((task) => task.blocking && task.status !== "Completed");
}
//# sourceMappingURL=governance-tasks.js.map