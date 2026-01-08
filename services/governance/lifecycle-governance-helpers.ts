/**
 * Lifecycle Governance UI Helpers
 * 
 * Provides helper functions for UI to determine disabled states and tooltip messages
 */

import type { LifecycleStage } from "../ai-governance-backend/services/governance/lifecycle-governance";
import { canEditRiskAssessment, canCreateRiskAssessmentInStage } from "../ai-governance-backend/services/governance/lifecycle-governance-rules";

/**
 * Get reason why an action is disabled based on lifecycle stage
 */
export function getDisabledReason(
  lifecycleStage: LifecycleStage | null,
  systemType: 'EU AI Act' | 'MAS' | 'UK AI Act' | null,
  action: 'edit' | 'create' | 'submit' | 'approve' | 'reject' | 'update_mitigation',
  assessmentStatus?: 'draft' | 'submitted' | 'approved' | 'rejected'
): string | null {
  // Lifecycle governance only applies to EU AI Act
  if (systemType !== 'EU AI Act' || !lifecycleStage) {
    return null; // Not disabled
  }

  switch (action) {
    case 'edit':
      if (assessmentStatus && !canEditRiskAssessment(lifecycleStage, assessmentStatus)) {
        if (lifecycleStage === 'Retired') {
          return "System is retired. All assessments are read-only.";
        }
        if (lifecycleStage === 'Deployed' || lifecycleStage === 'Monitoring') {
          if (assessmentStatus !== 'draft') {
            return `In ${lifecycleStage} stage, only draft assessments can be edited. This assessment is ${assessmentStatus}.`;
          }
        }
      }
      return null;

    case 'create':
      if (!canCreateRiskAssessmentInStage(lifecycleStage)) {
        return "System is retired. No new assessments can be created.";
      }
      return null;

    case 'submit':
      // Submit is always allowed if assessment is draft (workflow rule)
      return null;

    case 'approve':
    case 'reject':
      // Approve/reject are workflow actions, always allowed
      return null;

    case 'update_mitigation':
      // Mitigation status can be updated for approved/submitted assessments
      if (lifecycleStage === 'Retired') {
        return "System is retired. Mitigation status cannot be updated.";
      }
      return null;

    default:
      return null;
  }
}

/**
 * Check if action should be disabled based on lifecycle stage
 */
export function isActionDisabled(
  lifecycleStage: LifecycleStage | null,
  systemType: 'EU AI Act' | 'MAS' | 'UK AI Act' | null,
  action: 'edit' | 'create' | 'submit' | 'approve' | 'reject' | 'update_mitigation',
  assessmentStatus?: 'draft' | 'submitted' | 'approved' | 'rejected'
): boolean {
  const reason = getDisabledReason(lifecycleStage, systemType, action, assessmentStatus);
  return reason !== null;
}

/**
 * Get lifecycle stage transition restrictions
 */
export function canTransitionFromTo(
  currentStage: LifecycleStage,
  newStage: LifecycleStage
): { allowed: boolean; reason?: string } {
  // Retired cannot transition
  if (currentStage === 'Retired') {
    return {
      allowed: false,
      reason: "Retired systems cannot be moved to another lifecycle stage. System is read-only."
    };
  }

  // Monitoring cannot go back
  if (currentStage === 'Monitoring' && ['Draft', 'Development', 'Testing', 'Deployed'].includes(newStage)) {
    return {
      allowed: false,
      reason: "Cannot move back from Monitoring stage. Systems in Monitoring can only move forward to Retired."
    };
  }

  return { allowed: true };
}
