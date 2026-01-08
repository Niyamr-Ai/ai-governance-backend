/**
 * Lifecycle Governance Utilities
 * 
 * Provides logic for lifecycle stage warnings and recommendations
 */

export type LifecycleStage = 'Draft' | 'Development' | 'Testing' | 'Deployed' | 'Monitoring' | 'Retired';

export interface LifecycleWarning {
  type: 'info' | 'warning' | 'error';
  message: string;
  action?: string;
}

/**
 * Get lifecycle warnings based on current stage and system state
 */
export function getLifecycleWarnings(
  lifecycleStage: LifecycleStage,
  hasApprovedRiskAssessments: boolean,
  riskAssessmentCount: number
): LifecycleWarning[] {
  const warnings: LifecycleWarning[] = [];

  switch (lifecycleStage) {
    case 'Draft':
      // No restrictions for draft
      break;

    case 'Development':
      if (riskAssessmentCount === 0) {
        warnings.push({
          type: 'info',
          message: 'Consider adding risk assessments during development',
          action: 'Add Risk Assessment',
        });
      }
      break;

    case 'Testing':
      if (!hasApprovedRiskAssessments) {
        warnings.push({
          type: 'warning',
          message: 'No approved risk assessments found. Recommended before testing phase.',
          action: 'Review Risk Assessments',
        });
      }
      break;

    case 'Deployed':
      if (!hasApprovedRiskAssessments) {
        warnings.push({
          type: 'warning',
          message: 'No approved risk assessments found. Recommended for deployed systems.',
          action: 'Review Risk Assessments',
        });
      }
      break;

    case 'Monitoring':
      // Allow new assessments, preserve history
      warnings.push({
        type: 'info',
        message: 'System is in monitoring phase. New assessments can be added to track ongoing risks.',
      });
      break;

    case 'Retired':
      warnings.push({
        type: 'info',
        message: 'System is retired. View-only mode.',
      });
      break;
  }

  return warnings;
}

/**
 * Check if lifecycle stage allows editing
 */
export function canEditInLifecycleStage(stage: LifecycleStage): boolean {
  return stage !== 'Retired';
}

/**
 * Check if lifecycle stage allows creating risk assessments
 */
export function canCreateRiskAssessment(stage: LifecycleStage): boolean {
  return stage !== 'Retired';
}
