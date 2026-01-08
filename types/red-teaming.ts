/**
 * Red Teaming Types
 */

export type AttackType = 'prompt_injection' | 'jailbreak' | 'data_leakage' | 'policy_bypass';
export type TestStatus = 'PASS' | 'FAIL';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RedTeamingResult {
  id: string;
  ai_system_id: string;
  system_name?: string | null;
  attack_type: AttackType;
  attack_prompt: string;
  system_response: string;
  test_status: TestStatus;
  risk_level: RiskLevel;
  failure_reason: string | null;
  tested_by: string | null;
  tested_at: string;
  created_at: string;
}

export interface RunRedTeamingTestsInput {
  ai_system_id?: string;
  attack_types?: AttackType[];
  test_all?: boolean;
}

