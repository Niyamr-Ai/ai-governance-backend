export type MasPillarStatus = {
  status: "Compliant" | "Partially compliant" | "Non-compliant";
  score: number; // 0–100
  gaps: string[];
  recommendations: string[];
};

export type MasRiskLevel = "Low" | "Medium" | "High" | "Critical";
export type MasComplianceStatus =
  | "Compliant"
  | "Partially compliant"
  | "Non-compliant";
export type MasSystemStatus =
  | "development"
  | "staging"
  | "production"
  | "deprecated";

export interface MasAssessmentResult {
  id: string;
  user_id: string | null;
  created_at: string;
  system_name: string;
  description: string;
  owner: string;
  jurisdiction: string;
  sector: string;
  system_status: MasSystemStatus;
  business_use_case: string;
  data_types: string;
  uses_personal_data: boolean;
  uses_special_category_data: boolean;
  uses_third_party_ai: boolean;

  governance: MasPillarStatus;
  inventory: MasPillarStatus;
  dataManagement: MasPillarStatus;
  transparency: MasPillarStatus;
  fairness: MasPillarStatus;
  humanOversight: MasPillarStatus;
  thirdParty: MasPillarStatus;
  algoSelection: MasPillarStatus;
  evaluationTesting: MasPillarStatus;
  techCybersecurity: MasPillarStatus;
  monitoringChange: MasPillarStatus;
  capabilityCapacity: MasPillarStatus;

  overall_risk_level: MasRiskLevel;
  overall_compliance_status: MasComplianceStatus;
  summary: string;
}
