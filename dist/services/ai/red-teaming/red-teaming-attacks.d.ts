/**
 * Red Teaming Attack Prompt Library
 * Predefined adversarial prompts for testing AI/LLM systems
 */
export type AttackType = 'prompt_injection' | 'jailbreak' | 'data_leakage' | 'policy_bypass';
export interface AttackPrompt {
    type: AttackType;
    name: string;
    prompt: string;
    description: string;
}
export declare const ATTACK_PROMPTS: AttackPrompt[];
/**
 * Get all attack prompts of a specific type
 */
export declare function getAttacksByType(type: AttackType): AttackPrompt[];
/**
 * Get a random attack prompt
 */
export declare function getRandomAttack(): AttackPrompt;
/**
 * Get all attack prompts
 */
export declare function getAllAttacks(): AttackPrompt[];
//# sourceMappingURL=red-teaming-attacks.d.ts.map