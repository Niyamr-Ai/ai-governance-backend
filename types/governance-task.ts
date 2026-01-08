export type GovernanceRegulation = 'EU' | 'UK' | 'MAS';
export type GovernanceTaskStatus = 'Pending' | 'Completed' | 'Blocked';

export interface GovernanceTask {
  id: string;
  ai_system_id: string;
  title: string;
  description: string | null;
  regulation: GovernanceRegulation;
  status: GovernanceTaskStatus;
  blocking: boolean;
  evidence_link?: string | null;
  related_entity_id?: string | null;
  related_entity_type?: 'risk_assessment' | 'documentation' | null;
  created_at: string;
  completed_at?: string | null;
}

