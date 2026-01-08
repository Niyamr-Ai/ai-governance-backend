/**
 * Risk Assessments API Controller
 *
 * POST /api/risk-assessments/[id]/submit - Submit risk assessment for review
 */

import { Request, Response } from 'express';
import { createClient } from '../../utils/supabase/server';
import { getUserId } from '../../middleware/auth';
import type { ReviewAssessmentInput, RiskAssessment, UpdateRiskAssessmentInput } from '../../types/risk-assessment';
import { evaluateGovernanceTasks } from '../../services/governance/governance-tasks';
import { canEditRiskAssessment, type LifecycleStage } from '../../services/governance/lifecycle-governance-rules';

/**
 * POST /api/risk-assessments/[id]/submit - Submit risk assessment for review
 * Changes assessment status from 'draft' to 'submitted'
 * Only the creator can submit their own assessment
 */
export async function submitRiskAssessment(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const supabase = await createClient();

    // Fetch the assessment
    const { data: assessment, error: fetchError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Check if user is the creator
    if (assessment.assessed_by !== userId) {
      return res.status(403).json({
        error: "Forbidden: Only the creator can submit this assessment"
      });
    }

    // Validate status - only draft can be submitted
    if (assessment.status !== 'draft') {
      return res.status(400).json({
        error: `Cannot submit assessment with status '${assessment.status}'. Only draft assessments can be submitted.`
      });
    }

    // Governance Rule: High risk assessments require evidence
    if (assessment.risk_level === 'high' && (!assessment.evidence_links || assessment.evidence_links.length === 0)) {
      return res.status(400).json({
        error: "High-risk assessments require at least one evidence link before submission"
      });
    }

    // Update status to submitted
    const { data: updatedAssessment, error: updateError } = await supabase
      .from("risk_assessments")
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString()
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error submitting risk assessment:", updateError);
      return res.status(500).json({
        error: "Failed to submit assessment",
        details: updateError.message
      });
    }

    return res.status(200).json({
      message: "Assessment submitted for review",
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error("POST /api/risk-assessments/[id]/submit error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/risk-assessments/[id]/approve
 * Approve risk assessment (changes status from 'submitted' to 'approved')
 * Only admins/compliance officers can approve
 * Approved assessments count toward overall risk level
 */
export async function approveRiskAssessment(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const body: ReviewAssessmentInput = req.body || {};
    const supabase = await createClient();

    // TODO: Later restrict to admins/compliance only
    // For now, any authenticated user can approve
    // const { data: user } = await supabase.auth.getUser();
    // const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
    //                 user?.user?.user_metadata?.role === 'Admin' ||
    //                 user?.user?.user_metadata?.role === 'compliance';
    // if (!isAdmin) {
    //   return res.status(403).json({
    //     error: "Forbidden: Only admins or compliance officers can approve assessments"
    //   });
    // }

    // Fetch the assessment
    const { data: assessment, error: fetchError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Validate status - only submitted can be approved
    if (assessment.status !== 'submitted') {
      return res.status(400).json({
        error: `Cannot approve assessment with status '${assessment.status}'. Only submitted assessments can be approved.`
      });
    }

    // Shadow AI Governance: Check for confirmed Shadow AI
    const { shouldBlockComplianceApproval } = await import("../../services/compliance/shadow-ai-governance");
    const shadowCheck = await shouldBlockComplianceApproval(assessment.ai_system_id);

    if (shadowCheck.shouldBlock) {
      return res.status(403).json({
        error: shadowCheck.reason || "Cannot approve: Shadow AI detected",
        shadow_ai_blocked: true
      });
    }

    // Update status to approved
    const { data: updatedAssessment, error: updateError } = await supabase
      .from("risk_assessments")
      .update({
        status: 'approved',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_comment: body.review_comment || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error approving risk assessment:", updateError);
      return res.status(500).json({
        error: "Failed to approve assessment",
        details: updateError.message
      });
    }

    // Auto-update governance tasks after approval
    await evaluateGovernanceTasks(updatedAssessment.ai_system_id);

    // Auto-regenerate documentation when risk assessment is approved (non-blocking)
    // Don't await - let it run in background
    void (async () => {
      try {
        const { autoRegenerateDocumentationOnRiskApproval } = await import("../../services/documentation/documentation-auto-generate");
        console.log(`[Auto-Doc] Starting regeneration for system ${updatedAssessment.ai_system_id} after risk assessment approval`);
        await autoRegenerateDocumentationOnRiskApproval(updatedAssessment.ai_system_id);
        console.log(`[Auto-Doc] Completed regeneration for system ${updatedAssessment.ai_system_id}`);
      } catch (err: any) {
        console.error(`[Auto-Doc] Failed to regenerate docs for system ${updatedAssessment.ai_system_id}:`, err.message || err);
      }
    })();

    return res.status(200).json({
      message: "Assessment approved",
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error("POST /api/risk-assessments/[id]/approve error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/risk-assessments/[id]/reject
 * Reject risk assessment (changes status from 'submitted' to 'rejected')
 * Only admins/compliance officers can reject
 * Rejected assessments do NOT count toward overall risk level
 */
export async function rejectRiskAssessment(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const body: ReviewAssessmentInput = req.body || {};
    const supabase = await createClient();

    // TODO: Later restrict to admins/compliance only
    // For now, any authenticated user can reject
    // const { data: user } = await supabase.auth.getUser();
    // const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
    //                 user?.user?.user_metadata?.role === 'Admin' ||
    //                 user?.user?.user_metadata?.role === 'compliance';
    // if (!isAdmin) {
    //   return res.status(403).json({
    //     error: "Forbidden: Only admins or compliance officers can reject assessments"
    //   });
    // }

    // Fetch the assessment
    const { data: assessment, error: fetchError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Validate status - only submitted can be rejected
    if (assessment.status !== 'submitted') {
      return res.status(400).json({
        error: `Cannot reject assessment with status '${assessment.status}'. Only submitted assessments can be rejected.`
      });
    }

    // Require review comment for rejection
    if (!body.review_comment || body.review_comment.trim().length === 0) {
      return res.status(400).json({
        error: "Review comment is required when rejecting an assessment"
      });
    }

    // Update status to rejected
    const { data: updatedAssessment, error: updateError } = await supabase
      .from("risk_assessments")
      .update({
        status: 'rejected',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_comment: body.review_comment,
        updated_at: new Date().toISOString()
      })
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error rejecting risk assessment:", updateError);
      return res.status(500).json({
        error: "Failed to reject assessment",
        details: updateError.message
      });
    }

    return res.status(200).json({
      message: "Assessment rejected",
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error("POST /api/risk-assessments/[id]/reject error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * PUT /api/risk-assessments/[id]/mitigation-status
 * Updates the mitigation status of a risk assessment
 * Mitigation status can be updated independently of workflow status
 */
export async function updateMitigationStatus(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const body = req.body;
    const supabase = await createClient();

    // Validate mitigation_status
    if (!body.mitigation_status) {
      return res.status(400).json({ error: "mitigation_status is required" });
    }

    const validStatuses: ('not_started' | 'in_progress' | 'mitigated')[] = ['not_started', 'in_progress', 'mitigated'];
    if (!validStatuses.includes(body.mitigation_status)) {
      return res.status(400).json({
        error: `Invalid mitigation_status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Check if assessment exists
    const { data: assessment, error: fetchError } = await supabase
      .from("risk_assessments")
      .select("id, status")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !assessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Update mitigation status
    // Note: Mitigation status can be updated regardless of workflow status
    // (approved/submitted assessments can have their mitigation status updated)
    // We use RPC or direct update - RLS policy should allow this for approved/submitted
    const { data: updatedAssessment, error: updateError } = await supabase
      .from("risk_assessments")
      .update({
        mitigation_status: body.mitigation_status,
        updated_at: new Date().toISOString()
      })
      .eq("id", assessmentId)
      .select()
      .maybeSingle(); // Use maybeSingle to handle case where RLS blocks update

    if (updateError) {
      console.error("Error updating mitigation status:", updateError);
      // Check if it's an RLS policy violation
      if (updateError.code === 'PGRST301' || updateError.message?.includes('row-level security')) {
        return res.status(403).json({
          error: "Permission denied: RLS policy prevents updating this assessment. Please run the migration: supabase/migrations/add_mitigation_status_update_policy.sql"
        });
      }
      return res.status(500).json({
        error: "Failed to update mitigation status",
        details: updateError.message
      });
    }

    if (!updatedAssessment) {
      return res.status(500).json({
        error: "Failed to update mitigation status: No rows updated. This may be due to RLS policy restrictions."
      });
    }

    return res.status(200).json({
      message: "Mitigation status updated successfully",
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error("PUT /api/risk-assessments/[id]/mitigation-status error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * GET /api/risk-assessments/[id] - Get a specific risk assessment
 */
export async function getRiskAssessmentById(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const supabase = await createClient();

    const { data: assessment, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Risk assessment not found" });
      }
      console.error("Error fetching risk assessment:", error);
      return res.status(500).json({
        error: "Failed to fetch risk assessment",
        details: error.message
      });
    }

    return res.status(200).json(assessment as RiskAssessment);
  } catch (error: any) {
    console.error("GET /api/risk-assessments/[id] error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * PUT /api/risk-assessments/[id] - Update a risk assessment (Admin/Assessor only)
 */
export async function updateRiskAssessment(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const body: UpdateRiskAssessmentInput = req.body;
    const supabase = await createClient();

    // Check if assessment exists and user has permission
    const { data: existingAssessment, error: fetchError } = await supabase
      .from("risk_assessments")
      .select("assessed_by")
      .eq("id", assessmentId)
      .single();

    if (fetchError || !existingAssessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Fetch full assessment to check status
    const { data: fullAssessment, error: fullFetchError } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (fullFetchError || !fullAssessment) {
      return res.status(404).json({ error: "Risk assessment not found" });
    }

    // Workflow Rule: Only draft assessments can be edited
    if (fullAssessment.status !== 'draft') {
      return res.status(400).json({
        error: `Cannot edit assessment with status '${fullAssessment.status}'. Only draft assessments can be edited.`
      });
    }

    // Check if user is the creator (only creator can edit draft)
    if (fullAssessment.assessed_by !== userId) {
      return res.status(403).json({
        error: "Forbidden: Only the creator can edit draft assessments"
      });
    }

    // Lifecycle Governance: Check if edits are allowed based on system lifecycle stage
    // NOTE: Lifecycle governance is ONLY for EU AI Act assessments
    const aiSystemId = fullAssessment.ai_system_id;

    // Check if this is an EU AI Act system
    const { data: euSystem } = await supabase
      .from("eu_ai_act_check_results")
      .select("lifecycle_stage")
      .eq("id", aiSystemId)
      .maybeSingle();

    // Only apply lifecycle governance rules for EU AI Act systems
    if (euSystem) {
      const lifecycleStage = (euSystem.lifecycle_stage || 'Draft') as LifecycleStage;

      // Check if edit is allowed based on lifecycle stage
      if (!canEditRiskAssessment(lifecycleStage, fullAssessment.status as any)) {
        if (lifecycleStage === 'Deployed') {
          return res.status(403).json({
            error: "Cannot edit risk assessments in Production (Deployed) stage. Only draft assessments can be edited in Production.",
            lifecycle_stage: lifecycleStage
          });
        }
        if (lifecycleStage === 'Retired') {
          return res.status(403).json({
            error: "Cannot edit risk assessments for retired systems. System is read-only.",
            lifecycle_stage: lifecycleStage
          });
        }
      }
    }

    // Validate risk_level if provided
    if (body.risk_level) {
      const validRiskLevels = ['low', 'medium', 'high'];
      if (!validRiskLevels.includes(body.risk_level)) {
        return res.status(400).json({
          error: `Invalid risk_level. Must be one of: ${validRiskLevels.join(', ')}`
        });
      }
    }

    // Validate mitigation_status if provided
    if (body.mitigation_status) {
      const validStatuses = ['not_started', 'in_progress', 'mitigated'];
      if (!validStatuses.includes(body.mitigation_status)) {
        return res.status(400).json({
          error: `Invalid mitigation_status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Build update object (only include provided fields)
    const updateData: Partial<UpdateRiskAssessmentInput> = {};
    if (body.summary !== undefined) updateData.summary = body.summary;
    if (body.metrics !== undefined) updateData.metrics = body.metrics;
    if (body.risk_level !== undefined) updateData.risk_level = body.risk_level;
    if (body.mitigation_status !== undefined) updateData.mitigation_status = body.mitigation_status;
    if (body.evidence_links !== undefined) updateData.evidence_links = body.evidence_links;

    // Update the assessment
    const { data: updatedAssessment, error: updateError } = await supabase
      .from("risk_assessments")
      .update(updateData)
      .eq("id", assessmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating risk assessment:", updateError);
      return res.status(500).json({
        error: "Failed to update risk assessment",
        details: updateError.message
      });
    }

    return res.status(200).json(updatedAssessment as RiskAssessment);
  } catch (error: any) {
    console.error("PUT /api/risk-assessments/[id] error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * DELETE /api/risk-assessments/[id] - Delete a risk assessment (Admin only)
 */
export async function deleteRiskAssessment(req: Request, res: Response) {
  try {
    const userId = await getUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id: assessmentId } = req.params;
    const supabase = await createClient();

    // Check admin role
    const { data: user } = await supabase.auth.getUser();
    const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
                    user?.user?.user_metadata?.role === 'Admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: "Forbidden: Only admins can delete risk assessments"
      });
    }

    // Delete the assessment
    const { error: deleteError } = await supabase
      .from("risk_assessments")
      .delete()
      .eq("id", assessmentId);

    if (deleteError) {
      console.error("Error deleting risk assessment:", deleteError);
      return res.status(500).json({
        error: "Failed to delete risk assessment",
        details: deleteError.message
      });
    }

    return res.status(200).json({ message: "Risk assessment deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/risk-assessments/[id] error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
