/**
 * Governance Tasks API Controller
 *
 * POST /api/governance-tasks/suggestions - Generate smart governance suggestions
 */

import { Request, Response } from 'express';
import { createClient } from '../../utils/supabase/server';
import { getUserId } from '../../middleware/auth';
import { generateSmartGovernanceSuggestions, analyzeTaskCompletionImpact, getTaskContextualHelp, type TaskSuggestionContext } from '../../services/governance/smart-governance-suggestions';
import { evaluateGovernanceTasks } from '../../services/governance/governance-tasks';
import type { GovernanceRegulation, GovernanceTaskStatus } from '../../types/governance-task';

const ALLOWED_STATUSES: GovernanceTaskStatus[] = [
  "Pending",
  "Completed",
  "Blocked",
];

/**
 * POST /api/governance-tasks/suggestions
 * Generate smart governance suggestions
 */
export async function getGovernanceSuggestions(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body;
    const {
      systemId,
      systemName,
      systemDescription,
      riskLevel,
      complianceStatus,
      lifecycleStage,
      regulation,
      existingTasks = [],
      completedTasks = [],
      maxSuggestions = 8
    } = body;

    // Validate required fields
    if (!systemId || !systemName || !regulation) {
      return res.status(400).json({
        error: "Missing required fields: systemId, systemName, regulation"
      });
    }

    // Validate regulation type
    if (!['EU', 'UK', 'MAS'].includes(regulation)) {
      return res.status(400).json({
        error: "Invalid regulation type. Must be EU, UK, or MAS"
      });
    }

    const context: TaskSuggestionContext = {
      systemId,
      systemName,
      systemDescription: systemDescription || "",
      riskLevel: riskLevel || "unknown",
      complianceStatus: complianceStatus || "unknown",
      lifecycleStage: lifecycleStage || "Draft",
      regulation: regulation as GovernanceRegulation,
      existingTasks: Array.isArray(existingTasks) ? existingTasks : [],
      completedTasks: Array.isArray(completedTasks) ? completedTasks : [],
    };

    console.log(`[API] Generating smart governance suggestions for system ${systemId} (${regulation})`);

    const suggestions = await generateSmartGovernanceSuggestions(
      context,
      userId,
      Math.min(Math.max(1, maxSuggestions), 12) // Limit between 1-12
    );

    return res.json({
      suggestions,
      context: {
        systemId,
        systemName,
        regulation,
        generated_at: new Date().toISOString(),
        suggestion_count: suggestions.length
      }
    });

  } catch (error) {
    console.error("[API] Error generating governance suggestions:", error);
    return res.status(500).json({
      error: "Failed to generate suggestions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/governance-tasks/completion-impact
 * Analyze the impact of completing a governance task
 */
export async function analyzeCompletionImpact(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body;
    const {
      completedTaskTitle,
      systemId,
      systemName,
      systemDescription,
      riskLevel,
      complianceStatus,
      lifecycleStage,
      regulation,
      existingTasks = [],
      completedTasks = []
    } = body;

    // Validate required fields
    if (!completedTaskTitle || !systemId || !systemName || !regulation) {
      return res.status(400).json({
        error: "Missing required fields: completedTaskTitle, systemId, systemName, regulation"
      });
    }

    // Validate regulation type
    if (!['EU', 'UK', 'MAS'].includes(regulation)) {
      return res.status(400).json({
        error: "Invalid regulation type. Must be EU, UK, or MAS"
      });
    }

    const context: TaskSuggestionContext = {
      systemId,
      systemName,
      systemDescription: systemDescription || "",
      riskLevel: riskLevel || "unknown",
      complianceStatus: complianceStatus || "unknown",
      lifecycleStage: lifecycleStage || "Draft",
      regulation: regulation as GovernanceRegulation,
      existingTasks: Array.isArray(existingTasks) ? existingTasks : [],
      completedTasks: Array.isArray(completedTasks) ? completedTasks : [],
    };

    console.log(`[API] Analyzing completion impact for task "${completedTaskTitle}" on system ${systemId}`);

    const impact = await analyzeTaskCompletionImpact(
      completedTaskTitle,
      context,
      userId
    );

    return res.json({
      completed_task: completedTaskTitle,
      impact_analysis: impact,
      system_context: {
        systemId,
        systemName,
        regulation
      },
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error analyzing completion impact:", error);
    return res.status(500).json({
      error: "Failed to analyze completion impact",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * PATCH /api/governance-tasks/[taskId]
 * Update governance task status and evidence
 */
export async function updateGovernanceTask(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { taskId } = req.params;
    const body = req.body || {};
    const { status, evidence_link } = body;

    const supabase = await createClient();

    const { data: existingTask, error: fetchError } = await supabase
      .from("governance_tasks")
      .select("*")
      .eq("id", taskId)
      .maybeSingle();

    if (fetchError || !existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    if (
      existingTask.status === "Completed" &&
      status &&
      status !== "Completed"
    ) {
      return res.status(400).json({
        error: "Completed tasks cannot be reopened"
      });
    }

    const updates: Record<string, any> = {};

    if (status && status !== existingTask.status) {
      updates.status = status;
      if (status === "Completed") {
        updates.completed_at = new Date().toISOString();
      }
    }

    if (evidence_link !== undefined) {
      updates.evidence_link = evidence_link || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update"
      });
    }

    const { data: updatedTask, error: updateError } = await supabase
      .from("governance_tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .maybeSingle();

    if (updateError || !updatedTask) {
      console.error("Failed to update governance task", updateError);
      return res.status(500).json({ error: "Failed to update task" });
    }

    // Re-evaluate tasks to auto-close other items based on the new state
    void evaluateGovernanceTasks(updatedTask.ai_system_id);

    return res.status(200).json({
      message: "Task updated",
      task: updatedTask
    });
  } catch (error: any) {
    console.error("PATCH /api/governance-tasks/[taskId] error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/governance-tasks/contextual-help
 * Get contextual help for governance tasks
 */
export async function getContextualHelp(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const body = req.body;
    const {
      taskTitle,
      taskDescription,
      systemId,
      systemName,
      systemDescription,
      riskLevel,
      complianceStatus,
      lifecycleStage,
      regulation,
      existingTasks = [],
      completedTasks = []
    } = body;

    // Validate required fields
    if (!taskTitle || !systemId || !systemName || !regulation) {
      return res.status(400).json({
        error: "Missing required fields: taskTitle, systemId, systemName, regulation"
      });
    }

    // Validate regulation type
    if (!['EU', 'UK', 'MAS'].includes(regulation)) {
      return res.status(400).json({
        error: "Invalid regulation type. Must be EU, UK, or MAS"
      });
    }

    const context: TaskSuggestionContext = {
      systemId,
      systemName,
      systemDescription: systemDescription || "",
      riskLevel: riskLevel || "unknown",
      complianceStatus: complianceStatus || "unknown",
      lifecycleStage: lifecycleStage || "Draft",
      regulation: regulation as GovernanceRegulation,
      existingTasks: Array.isArray(existingTasks) ? existingTasks : [],
      completedTasks: Array.isArray(completedTasks) ? completedTasks : [],
    };

    console.log(`[API] Getting contextual help for task "${taskTitle}" on system ${systemId}`);

    const help = await getTaskContextualHelp(
      taskTitle,
      taskDescription || "",
      context,
      userId
    );

    return res.json({
      task_title: taskTitle,
      contextual_help: help,
      system_context: {
        systemId,
        systemName,
        regulation
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error getting contextual help:", error);
    return res.status(500).json({
      error: "Failed to get contextual help",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
