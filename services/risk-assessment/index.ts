/**
 * Risk Assessment Utilities
 * 
 * Helper functions for calculating overall risk levels and managing risk assessments.
 */

import type { RiskAssessment, RiskLevel, OverallRiskLevel } from "@/ai-governance-backend/types/risk-assessment";

/**
 * Calculate the overall risk level for an AI system based on its assessments.
 * 
 * Governance Rule: Only APPROVED assessments count toward overall risk level
 * Overall risk = highest individual risk among APPROVED assessments
 * 
 * @param assessments Array of risk assessments for the system
 * @returns Overall risk level with metadata
 */
export function calculateOverallRiskLevel(
  assessments: RiskAssessment[]
): OverallRiskLevel {
  // Filter to only approved assessments (governance rule)
  const approvedAssessments = assessments.filter(
    (a) => a.status === "approved"
  );

  if (approvedAssessments.length === 0) {
    return {
      level: "low",
      highest_category: null,
      assessment_count: 0,
      mitigated_count: 0,
    };
  }

  // Risk level priority: high > medium > low
  const riskOrder: Record<RiskLevel, number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  // Find the highest risk assessment among approved ones
  const highestRiskAssessment = approvedAssessments.reduce((max, assessment) => {
    return riskOrder[assessment.risk_level] > riskOrder[max.risk_level]
      ? assessment
      : max;
  }, approvedAssessments[0]);

  // Count mitigated assessments (only approved)
  const mitigatedCount = approvedAssessments.filter(
    (a) => a.mitigation_status === "mitigated"
  ).length;

  return {
    level: highestRiskAssessment.risk_level,
    highest_category: highestRiskAssessment.category,
    assessment_count: approvedAssessments.length,
    mitigated_count: mitigatedCount,
  };
}

/**
 * Get risk level badge styling classes
 */
export function getRiskLevelClasses(level: RiskLevel): string {
  const classes = {
    low: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50 hover:bg-emerald-800/70",
    medium: "bg-amber-900/50 text-amber-300 border-amber-700/50 hover:bg-amber-800/70",
    high: "bg-red-900/50 text-red-300 border-red-700/50 hover:bg-red-800/70",
  };
  return classes[level];
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    bias: "Bias & Fairness",
    robustness: "Robustness & Performance",
    privacy: "Privacy & Data Leakage",
    explainability: "Explainability",
  };
  return labels[category] || category;
}

/**
 * Get mitigation status display label
 */
export function getMitigationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    not_started: "Not Started",
    in_progress: "In Progress",
    mitigated: "Mitigated",
  };
  return labels[status] || status;
}
