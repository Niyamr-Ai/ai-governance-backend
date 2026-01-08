import type { GovernanceTask } from "../../types/governance-task";
/**
 * Evaluate governance rules and ensure tasks are created/updated.
 */
export declare function evaluateGovernanceTasks(systemId: string): Promise<GovernanceTask[]>;
export declare function getBlockingTasks(systemId: string): Promise<GovernanceTask[]>;
//# sourceMappingURL=governance-tasks.d.ts.map