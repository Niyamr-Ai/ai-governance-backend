/**
 * Dashboard Insights Service
 *
 * Provides RAG-powered contextual insights for compliance dashboards.
 * Uses Regulation RAG to provide specific guidance based on system status and compliance data.
 */
import { type RegulationType } from '../ai/rag-service';
export type ComplianceStatus = 'compliant' | 'partially_compliant' | 'non_compliant' | 'unknown';
export type RiskTier = 'prohibited' | 'high_risk' | 'limited_risk' | 'minimal_risk' | 'unknown';
/**
 * Insight types for different dashboard contexts
 */
export interface ComplianceInsight {
    type: 'obligation' | 'recommendation' | 'warning' | 'next_step';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    regulatoryContext?: string;
    actionable: boolean;
    relatedArticles?: string[];
}
/**
 * Dashboard summary with insights
 */
export interface DashboardInsights {
    overallGuidance: string;
    keyInsights: ComplianceInsight[];
    riskTierGuidance: Record<string, string>;
    complianceStatusGuidance: Record<string, string>;
    nextSteps: string[];
    regulatoryUpdates?: string;
}
/**
 * System-specific insights
 */
export interface SystemInsights {
    systemId: string;
    systemName: string;
    riskTier: RiskTier;
    complianceStatus: ComplianceStatus;
    insights: ComplianceInsight[];
    recommendedActions: string[];
    regulatoryContext: string;
}
/**
 * Get comprehensive dashboard insights
 *
 * @param systemsData - Array of system compliance data
 * @param regulationType - Primary regulation type (EU, UK, MAS)
 * @returns Dashboard insights with RAG-powered guidance
 */
export declare function getDashboardInsights(systemsData: any[], regulationType?: RegulationType): Promise<DashboardInsights>;
/**
 * Get insights for a specific system
 *
 * @param systemData - Individual system compliance data
 * @param regulationType - Regulation type (EU, UK, MAS)
 * @returns System-specific insights
 */
export declare function getSystemInsights(systemData: any, regulationType?: RegulationType): Promise<SystemInsights>;
//# sourceMappingURL=dashboard-insights.d.ts.map