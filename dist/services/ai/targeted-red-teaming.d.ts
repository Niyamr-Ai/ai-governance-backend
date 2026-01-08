/**
 * Targeted Red Teaming Service
 *
 * Uses Platform RAG + User System RAG to generate targeted, system-specific
 * attack scenarios and security tests based on system characteristics.
 */
import { type AttackPrompt, type AttackType } from '@/ai-governance-backend/services/ai/red-teaming/red-teaming-attacks';
/**
 * Enhanced attack prompt with system-specific targeting
 */
export interface TargetedAttackPrompt extends AttackPrompt {
    systemContext?: string;
    targetedPrompt: string;
    vulnerabilityFocus: string[];
    riskFactors: string[];
    customization: 'high' | 'medium' | 'low';
}
/**
 * Test generation strategy
 */
export interface TestGenerationStrategy {
    systemId: string;
    systemName: string;
    systemType: string;
    riskProfile: string[];
    vulnerabilities: string[];
    attackTypes: AttackType[];
    testCount: number;
}
/**
 * Targeted test suite
 */
export interface TargetedTestSuite {
    systemId: string;
    systemName: string;
    strategy: TestGenerationStrategy;
    attacks: TargetedAttackPrompt[];
    recommendations: string[];
    riskAssessment: string;
}
/**
 * Generate targeted red teaming tests for a specific AI system
 *
 * @param systemId - AI system identifier
 * @param userId - User ID for tenant isolation
 * @param attackTypes - Specific attack types to focus on (optional)
 * @param testCount - Number of tests to generate (default: 5)
 * @returns Targeted test suite with system-specific attacks
 */
export declare function generateTargetedTests(systemId: string, userId: string, attackTypes?: AttackType[], testCount?: number): Promise<TargetedTestSuite>;
//# sourceMappingURL=targeted-red-teaming.d.ts.map