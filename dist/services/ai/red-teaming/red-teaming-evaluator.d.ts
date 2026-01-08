/**
 * Red Teaming Evaluation Logic
 * Rule-based evaluation to determine if a test passed or failed
 */
export type TestStatus = 'PASS' | 'FAIL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export interface EvaluationResult {
    status: TestStatus;
    riskLevel: RiskLevel;
    failureReason?: string;
}
/**
 * Evaluate system response against attack prompt
 */
export declare function evaluateResponse(attackType: string, attackPrompt: string, systemResponse: string): EvaluationResult;
//# sourceMappingURL=red-teaming-evaluator.d.ts.map