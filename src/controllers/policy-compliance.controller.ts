/**
 * Policy Compliance API Controller
 *
 * POST /api/policy-compliance/analyze - Analyze policy compliance
 * POST /api/policy-compliance/conflicts - Analyze policy conflicts
 * POST /api/policy-compliance/gaps - Analyze policy gaps
 */

import { Request, Response } from 'express';

/**
 * POST /api/policy-compliance/analyze - Analyze policy compliance
 */
export async function analyzePolicyComplianceHandler(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { system_id, policy_ids } = body;

    // Validate required fields
    if (!system_id) {
      return res.status(400).json({ error: "Missing required field: system_id" });
    }

    const { supabaseAdmin } = await import('../../src/lib/supabase');
    const supabase = supabaseAdmin;

    // Fetch AI system information
    const { data: systemInfo, error: systemError } = await supabase
      .from("ai_system_registry")
      .select("*")
      .eq("system_id", system_id)
      .single();

    if (systemError || !systemInfo) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Fetch policies (either specific ones or all applicable)
    let policiesQuery = supabase
      .from("policies")
      .select(`
        id,
        name,
        description,
        policy_type,
        jurisdiction,
        policy_requirements (
          title,
          description
        )
      `);

    if (policy_ids && Array.isArray(policy_ids) && policy_ids.length > 0) {
      policiesQuery = policiesQuery.in("id", policy_ids);
    }

    const { data: policies, error: policiesError } = await policiesQuery;

    if (policiesError) {
      console.error("Error fetching policies:", policiesError);
      return res.status(500).json({
        error: "Failed to fetch policies",
        details: policiesError.message
      });
    }

    if (!policies || policies.length === 0) {
      return res.status(200).json({
        analyses: [],
        message: "No applicable policies found for analysis",
        system: {
          id: systemInfo.system_id,
          name: systemInfo.name
        }
      });
    }

    console.log(`[API] Analyzing policy compliance for system ${system_id} against ${policies.length} policies`);

    // Transform policies for analysis
    const transformedPolicies = policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description || '',
      policy_type: policy.policy_type,
      jurisdiction: policy.jurisdiction,
      requirements: policy.policy_requirements?.map((req: any) => req.title) || []
    }));

    // Analyze compliance using RAG
    const { analyzePolicyCompliance } = await import('../../services/compliance/smart-policy-compliance');
    const analyses = await analyzePolicyCompliance(
      {
        id: systemInfo.system_id,
        name: systemInfo.name,
        description: systemInfo.description || '',
        risk_level: systemInfo.risk_classification || 'medium',
        regulation_type: 'EU' // Could be dynamic based on system data
      },
      transformedPolicies,
      userId
    );

    // Calculate overall compliance metrics
    const overallMetrics = {
      total_policies: policies.length,
      compliant: analyses.filter(a => a.compliance_status === 'compliant').length,
      partially_compliant: analyses.filter(a => a.compliance_status === 'partially_compliant').length,
      non_compliant: analyses.filter(a => a.compliance_status === 'non_compliant').length,
      not_assessed: analyses.filter(a => a.compliance_status === 'not_assessed').length,
      average_compliance_score: analyses.length > 0 ?
        Math.round(analyses.reduce((sum, a) => sum + a.compliance_score, 0) / analyses.length) : 0,
      average_confidence: analyses.length > 0 ?
        Math.round(analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length) : 0
    };

    return res.status(200).json({
      analyses,
      system: {
        id: systemInfo.system_id,
        name: systemInfo.name,
        risk_level: systemInfo.risk_classification
      },
      overall_metrics: overallMetrics,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error analyzing policy compliance:", error);
    return res.status(500).json({
      error: "Failed to analyze policy compliance",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/policy-compliance/conflicts - Analyze policy conflicts
 */
export async function analyzePolicyConflicts(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { policy_ids, system_characteristics } = body;

    // Validate required fields
    if (!policy_ids || !Array.isArray(policy_ids) || policy_ids.length < 2) {
      return res.status(400).json({ error: "At least 2 policy IDs are required for conflict detection" });
    }

    const { supabaseAdmin } = await import('../../src/lib/supabase');
    const supabase = supabaseAdmin;

    // Fetch policies with their requirements
    const { data: policies, error: policiesError } = await supabase
      .from("policies")
      .select(`
        id,
        name,
        description,
        policy_type,
        jurisdiction,
        policy_requirements (
          title,
          description
        )
      `)
      .in("id", policy_ids);

    if (policiesError) {
      console.error("Error fetching policies:", policiesError);
      return res.status(500).json({
        error: "Failed to fetch policies",
        details: policiesError.message
      });
    }

    if (!policies || policies.length < 2) {
      return res.status(404).json({ error: "Insufficient policies found for conflict analysis" });
    }

    console.log(`[API] Detecting conflicts among ${policies.length} policies`);

    // Transform policies for analysis
    const transformedPolicies = policies.map(policy => ({
      id: policy.id,
      name: policy.name,
      description: policy.description || '',
      policy_type: policy.policy_type,
      jurisdiction: policy.jurisdiction,
      requirements: policy.policy_requirements?.map((req: any) => req.title) || []
    }));

    // Use default system characteristics if not provided
    const defaultSystemCharacteristics = {
      risk_level: 'medium',
      system_type: 'AI System',
      data_sensitivity: 'medium',
      ...system_characteristics
    };

    // Detect policy conflicts using RAG
    const { detectPolicyConflicts } = await import('../../services/compliance/smart-policy-compliance');
    const conflictAnalysis = await detectPolicyConflicts(
      transformedPolicies,
      defaultSystemCharacteristics,
      userId
    );

    // Calculate conflict severity distribution
    const severityDistribution = {
      low: conflictAnalysis.conflicting_policies.filter(c => c.severity === 'low').length,
      medium: conflictAnalysis.conflicting_policies.filter(c => c.severity === 'medium').length,
      high: conflictAnalysis.conflicting_policies.filter(c => c.severity === 'high').length,
      total: conflictAnalysis.conflicting_policies.length
    };

    // Calculate conflict type distribution
    const typeDistribution = {
      requirement_contradiction: conflictAnalysis.conflicting_policies.filter(c => c.conflict_type === 'requirement_contradiction').length,
      scope_overlap: conflictAnalysis.conflicting_policies.filter(c => c.conflict_type === 'scope_overlap').length,
      enforcement_conflict: conflictAnalysis.conflicting_policies.filter(c => c.conflict_type === 'enforcement_conflict').length
    };

    return res.status(200).json({
      conflict_analysis: conflictAnalysis,
      policies_analyzed: policies.map(p => ({
        id: p.id,
        name: p.name,
        type: p.policy_type
      })),
      system_characteristics: defaultSystemCharacteristics,
      conflict_metrics: {
        severity_distribution: severityDistribution,
        type_distribution: typeDistribution,
        has_conflicts: conflictAnalysis.conflicting_policies.length > 0,
        overall_risk_level: conflictAnalysis.system_impact.risk_level
      },
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error detecting policy conflicts:", error);
    return res.status(500).json({
      error: "Failed to detect policy conflicts",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/policy-compliance/gaps - Analyze policy compliance gaps
 */
export async function analyzePolicyGaps(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { system_id } = body;

    // Validate required fields
    if (!system_id) {
      return res.status(400).json({ error: "Missing required field: system_id" });
    }

    const { supabaseAdmin } = await import('../../src/lib/supabase');
    const supabase = supabaseAdmin;

    // Fetch AI system information
    const { data: systemInfo, error: systemError } = await supabase
      .from("ai_system_registry")
      .select("*")
      .eq("system_id", system_id)
      .single();

    if (systemError || !systemInfo) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Fetch applicable policies with current compliance status
    const { data: policyMappings, error: mappingsError } = await supabase
      .from("system_policy_mappings")
      .select(`
        compliance_status,
        policies (
          id,
          name,
          description,
          policy_type
        )
      `)
      .eq("ai_system_id", system_id);

    if (mappingsError) {
      console.error("Error fetching policy mappings:", mappingsError);
      return res.status(500).json({
        error: "Failed to fetch policy mappings",
        details: mappingsError.message
      });
    }

    // Transform policy mappings
    const applicablePolicies = policyMappings?.map(mapping => ({
      id: mapping.policies[0].id,
      name: mapping.policies[0].name,
      description: mapping.policies[0].description || '',
      policy_type: mapping.policies[0].policy_type,
      current_compliance_status: mapping.compliance_status
    })) || [];

    if (applicablePolicies.length === 0) {
      return res.status(200).json({
        gap_identification: {
          system_id: system_id,
          applicable_policies: [],
          priority_gaps: [],
          overall_compliance_score: 100,
          next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        message: "No applicable policies found for this system"
      });
    }

    console.log(`[API] Identifying compliance gaps for system ${system_id} across ${applicablePolicies.length} policies`);

    // Identify compliance gaps using RAG
    const { identifyComplianceGaps } = await import('../../services/compliance/smart-policy-compliance');
    const gapIdentification = await identifyComplianceGaps(
      {
        id: systemInfo.system_id,
        name: systemInfo.name,
        description: systemInfo.description || '',
        risk_level: systemInfo.risk_classification || 'medium'
      },
      applicablePolicies,
      userId
    );

    return res.status(200).json({
      gap_identification: gapIdentification,
      system: {
        id: systemInfo.system_id,
        name: systemInfo.name,
        risk_level: systemInfo.risk_classification
      },
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error identifying compliance gaps:", error);
    return res.status(500).json({
      error: "Failed to identify compliance gaps",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
