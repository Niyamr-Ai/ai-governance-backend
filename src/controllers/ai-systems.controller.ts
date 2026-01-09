/**
 * AI Systems API Controller
 *
 * GET /api/ai-systems/list - Get all AI systems from EU, UK, MAS, and Registry tables
 */

import { Request, Response } from 'express';
import { supabase } from "../utils/supabase/client";
import { evaluateGovernanceTasks } from '../../services/governance/governance-tasks';
import { suggestBlockerResolutions } from '../../services/governance/smart-lifecycle-transition';
import { OpenAI } from 'openai';
import { getRegulationContextString } from '../../services/ai/rag-service';
import { calculateOverallRiskLevel } from '../../services/risk-assessment';
import { suggestRiskMitigations, analyzeRiskTrends, generateContextualRiskAssessment } from '../../services/risk-assessment/smart-assessment';
import { generateTransitionPlan, assessTransitionReadiness } from '../../services/governance/smart-lifecycle-transition';

/**
 * GET /api/ai-systems/list
 * Get all AI systems from EU, UK, MAS, and Registry tables
 */
export async function listAISystems(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }


    // Fetch systems from all compliance tables
    const [euSystems, ukSystems, masSystems] = await Promise.all([
      supabase
        .from("eu_ai_act_check_results")
        .select("id, system_name, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("uk_ai_assessments")
        .select("id, system_name, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("mas_ai_risk_assessments")
        .select("id, system_name, created_at")
        .order("created_at", { ascending: false }),
    ]);

    // Combine all systems with their source
    const systems = [
      ...(euSystems.data || []).map((s: any) => ({
        id: s.id,
        name: s.system_name || `EU System ${s.id.substring(0, 8)}`,
        source: "EU AI Act",
        created_at: s.created_at,
      })),
      ...(ukSystems.data || []).map((s: any) => ({
        id: s.id,
        name: s.system_name || `UK System ${s.id.substring(0, 8)}`,
        source: "UK AI Act",
        created_at: s.created_at,
      })),
      ...(masSystems.data || []).map((s: any) => ({
        id: s.id,
        name: s.system_name || `MAS System ${s.id.substring(0, 8)}`,
        source: "MAS",
        created_at: s.created_at,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json({ systems });
  } catch (error: any) {
    console.error("GET /api/ai-systems/list error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * GET /api/ai-systems/[id]/tasks
 * Get governance tasks for an AI system
 */
export async function getSystemTasks(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const tasks = await evaluateGovernanceTasks(systemId);

    return res.status(200).json({ tasks });
  } catch (error: any) {
    console.error("GET /api/ai-systems/[id]/tasks error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/ai-systems/[id]/blocker-resolutions
 * Generate blocker resolutions for AI system transition
 */
export async function postBlockerResolutions(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const { blockers } = req.body;

    // Validate required fields
    if (!blockers || !Array.isArray(blockers) || blockers.length === 0) {
      return res.status(400).json({ error: "Blockers array is required" });
    }

    // Get system data from multiple sources
    const [
      { data: euData },
      { data: ukData },
      { data: masData },
      { data: registryData }
    ] = await Promise.all([
      supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("ai_system_registry").select("*").eq("system_id", systemId).maybeSingle()
    ]);

    // Determine primary system data and regulation type
    let systemData: any = null;
    let regulationType = 'EU';

    if (euData) {
      systemData = euData;
      regulationType = 'EU';
    } else if (ukData) {
      systemData = ukData;
      regulationType = 'UK';
    } else if (masData) {
      systemData = masData;
      regulationType = 'MAS';
    } else if (registryData) {
      systemData = registryData;
      regulationType = 'EU'; // Default
    }

    if (!systemData) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Prepare system context for blocker resolution
    const systemContext = {
      id: systemId,
      name: systemData.system_name || systemData.name || `System ${systemId}`,
      risk_tier: systemData.risk_tier || systemData.risk_classification || 'medium',
      regulation_type: regulationType
    };

    // Validate blockers structure
    const validatedBlockers = blockers.map((blocker: any, index: number) => {
      if (!blocker.description || !blocker.blocker_type) {
        throw new Error(`Invalid blocker at index ${index}: description and blocker_type are required`);
      }

      return {
        blocker_type: blocker.blocker_type,
        description: blocker.description,
        severity: blocker.severity || 'medium',
        resolution_steps: Array.isArray(blocker.resolution_steps) ? blocker.resolution_steps : [],
        estimated_resolution_time: blocker.estimated_resolution_time || 'Not estimated',
        responsible_party: blocker.responsible_party || 'Not specified'
      };
    });

    console.log(`[API] Generating blocker resolutions for system ${systemId} with ${validatedBlockers.length} blockers`);

    // Generate blocker resolutions using RAG
    const blockerResolutions = await suggestBlockerResolutions(
      validatedBlockers,
      systemContext,
      userId
    );

    // Calculate resolution metrics
    const resolutionMetrics = {
      total_blockers: validatedBlockers.length,
      resolutions_generated: blockerResolutions.length,
      blockers_by_type: {
        regulatory: validatedBlockers.filter(b => b.blocker_type === 'regulatory').length,
        technical: validatedBlockers.filter(b => b.blocker_type === 'technical').length,
        process: validatedBlockers.filter(b => b.blocker_type === 'process').length,
        documentation: validatedBlockers.filter(b => b.blocker_type === 'documentation').length,
        governance: validatedBlockers.filter(b => b.blocker_type === 'governance').length
      },
      blockers_by_severity: {
        critical: validatedBlockers.filter(b => b.severity === 'critical').length,
        high: validatedBlockers.filter(b => b.severity === 'high').length,
        medium: validatedBlockers.filter(b => b.severity === 'medium').length,
        low: validatedBlockers.filter(b => b.severity === 'low').length
      },
      strategies_by_effort: {
        low: blockerResolutions.reduce((sum, resolution) =>
          sum + resolution.resolution_strategies.filter(s => s.estimated_effort === 'low').length, 0),
        medium: blockerResolutions.reduce((sum, resolution) =>
          sum + resolution.resolution_strategies.filter(s => s.estimated_effort === 'medium').length, 0),
        high: blockerResolutions.reduce((sum, resolution) =>
          sum + resolution.resolution_strategies.filter(s => s.estimated_effort === 'high').length, 0)
      }
    };

    // Generate prioritized action plan
    const prioritizedActions = [];

    // Critical and high severity blockers first
    const criticalBlockers = blockerResolutions.filter(r => r.severity === 'critical' || r.severity === 'high');
    if (criticalBlockers.length > 0) {
      prioritizedActions.push({
        priority: 'immediate',
        action: `Address ${criticalBlockers.length} critical/high severity blockers`,
        blockers: criticalBlockers.map(b => b.blocker_description),
        estimated_timeline: '1-2 weeks'
      });
    }

    // Regulatory blockers
    const regulatoryBlockers = blockerResolutions.filter(r => r.blocker_type === 'regulatory');
    if (regulatoryBlockers.length > 0) {
      prioritizedActions.push({
        priority: 'high',
        action: `Resolve ${regulatoryBlockers.length} regulatory compliance blockers`,
        blockers: regulatoryBlockers.map(b => b.blocker_description),
        estimated_timeline: '2-4 weeks'
      });
    }

    // Technical and process blockers
    const technicalProcessBlockers = blockerResolutions.filter(r =>
      r.blocker_type === 'technical' || r.blocker_type === 'process');
    if (technicalProcessBlockers.length > 0) {
      prioritizedActions.push({
        priority: 'medium',
        action: `Implement ${technicalProcessBlockers.length} technical and process improvements`,
        blockers: technicalProcessBlockers.map(b => b.blocker_description),
        estimated_timeline: '3-6 weeks'
      });
    }

    // Documentation and governance blockers
    const docGovernanceBlockers = blockerResolutions.filter(r =>
      r.blocker_type === 'documentation' || r.blocker_type === 'governance');
    if (docGovernanceBlockers.length > 0) {
      prioritizedActions.push({
        priority: 'medium',
        action: `Complete ${docGovernanceBlockers.length} documentation and governance requirements`,
        blockers: docGovernanceBlockers.map(b => b.blocker_description),
        estimated_timeline: '2-4 weeks'
      });
    }

    // Generate overall recommendations
    const overallRecommendations = [];

    if (resolutionMetrics.blockers_by_severity.critical > 0) {
      overallRecommendations.push('Establish dedicated task force for critical blocker resolution');
    }

    if (resolutionMetrics.blockers_by_type.regulatory > 0) {
      overallRecommendations.push('Engage regulatory compliance experts early in resolution process');
    }

    if (resolutionMetrics.strategies_by_effort.high > resolutionMetrics.strategies_by_effort.low) {
      overallRecommendations.push('Consider phased approach to manage high-effort resolution strategies');
    }

    if (blockerResolutions.some(r => r.resolution_strategies.some(s => s.success_probability === 'low'))) {
      overallRecommendations.push('Develop contingency plans for low-probability resolution strategies');
    }

    return res.status(200).json({
      blocker_resolutions: blockerResolutions,
      system: {
        id: systemId,
        name: systemContext.name,
        risk_tier: systemContext.risk_tier,
        regulation_type: systemContext.regulation_type
      },
      resolution_metrics: resolutionMetrics,
      prioritized_actions: prioritizedActions,
      overall_recommendations: overallRecommendations,
      implementation_guidance: {
        start_with: 'Critical and high severity blockers',
        parallel_execution: 'Consider parallel resolution of independent blockers',
        resource_allocation: 'Allocate experienced team members to regulatory blockers',
        monitoring: 'Establish weekly progress reviews for blocker resolution',
        escalation: 'Define clear escalation paths for stalled resolutions'
      },
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error generating blocker resolutions:", error);
    return res.status(500).json({
      error: "Failed to generate blocker resolutions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

const OPEN_AI_KEY = process.env.OPEN_AI_KEY;
const openai = OPEN_AI_KEY ? new OpenAI({ apiKey: OPEN_AI_KEY }) : null;

type RegulationType = 'EU AI Act' | 'UK AI Act' | 'MAS';

/**
 * GET /api/ai-systems/[id]/documentation
 * Get all documentation for an AI system
 */
export async function getDocumentation(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;

    // Fetch all documentation for this system
    const { data: docs, error } = await supabase
      .from("compliance_documentation")
      .select("*")
      .eq("ai_system_id", systemId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documentation:", error);
      return res.status(500).json({ error: "Failed to fetch documentation" });
    }

    return res.status(200).json({ documentation: docs || [] });
  } catch (error: any) {
    console.error("GET /api/ai-systems/[id]/documentation error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * GET /api/ai-systems/[id]/overall-risk
 * Get overall risk level for an AI system
 */
export async function getOverallRisk(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: aiSystemId } = req.params;


    // Fetch all risk assessments for this system
    const { data: assessments, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("ai_system_id", aiSystemId);

    if (error) {
      console.error("Error fetching risk assessments:", error);
      return res.status(500).json({
        error: "Failed to fetch risk assessments",
        details: error.message
      });
    }

    // Calculate overall risk level (only approved assessments count)
    const overallRisk = calculateOverallRiskLevel(assessments || []);

    return res.status(200).json(overallRisk);
  } catch (error: any) {
    console.error("GET /api/ai-systems/[id]/overall-risk error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * GET /api/ai-systems/[id]/policies
 * Get all policies mapped to an AI system
 */
export async function getSystemPolicies(req: Request, res: Response) {
  try {
    

    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;

    // Fetch mappings with policy details
    const { data: mappings, error } = await supabase
      .from("system_policy_mappings")
      .select(`
        *,
        policies (*)
      `)
      .eq("ai_system_id", systemId);

    if (error) {
      console.error("Error fetching policy mappings:", error);
      return res.status(500).json({ error: "Failed to fetch policy mappings" });
    }

    return res.status(200).json(mappings || []);
  } catch (error: any) {
    console.error("Error in GET /api/ai-systems/[id]/policies:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

/**
 * POST /api/ai-systems/[id]/policies
 * Map a policy to an AI system
 */
export async function postSystemPolicy(req: Request, res: Response) {
  try {

    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}



    const { id: systemId } = req.params;
    const body = req.body;

    // Validate required fields
    if (!body.policy_id) {
      return res.status(400).json({ error: "Policy ID is required" });
    }

    // Check if mapping already exists
    const { data: existing } = await supabase
      .from("system_policy_mappings")
      .select("id")
      .eq("policy_id", body.policy_id)
      .eq("ai_system_id", systemId)
      .single();

    if (existing) {
      return res.status(409).json({ error: "Policy already mapped to this system" });
    }

    // Create mapping
    const { data: mapping, error } = await supabase
      .from("system_policy_mappings")
      .insert({
        policy_id: body.policy_id,
        ai_system_id: systemId,
        compliance_status: body.compliance_status || "Not assessed",
        notes: body.notes || null,
        assessed_by: userId,
        assessed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating mapping:", error);
      return res.status(500).json({ error: "Failed to create policy mapping" });
    }

    return res.status(201).json(mapping);
  } catch (error: any) {
    console.error("Error in POST /api/ai-systems/[id]/policies:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}

/**
 * GET /api/ai-systems/[id]/risk-assessments
 * Get all risk assessments for an AI system
 */
export async function getSystemRiskAssessments(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: aiSystemId } = req.params;


    // Fetch all risk assessments for this system
    const { data: assessments, error } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("ai_system_id", aiSystemId)
      .order("assessed_at", { ascending: false });

    if (error) {
      console.error("Error fetching risk assessments:", error);
      return res.status(500).json({
        error: "Failed to fetch risk assessments",
        details: error.message
      });
    }

    return res.status(200).json(assessments);
  } catch (error: any) {
    console.error("GET /api/ai-systems/[id]/risk-assessments error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/ai-systems/[id]/risk-assessments
 * Create a new risk assessment for an AI system
 */
export async function postSystemRiskAssessment(req: Request, res: Response) {
  try {
      const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: aiSystemId } = req.params;
    const body = req.body;

    // Validate required fields
    if (!body.category || !body.summary || !body.risk_level) {
      return res.status(400).json({
        error: "Missing required fields: category, summary, risk_level"
      });
    }

    // Validate category
    const validCategories = ['bias', 'robustness', 'privacy', 'explainability'];
    if (!validCategories.includes(body.category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    // Validate risk level
    const validRiskLevels = ['low', 'medium', 'high'];
    if (!validRiskLevels.includes(body.risk_level)) {
      return res.status(400).json({
        error: `Invalid risk_level. Must be one of: ${validRiskLevels.join(', ')}`
      });
    }


    // Governance Rule: High risk assessments require evidence
    if (body.risk_level === 'high' && (!body.evidence_links || body.evidence_links.length === 0)) {
      return res.status(400).json({
        error: "High-risk assessments require at least one evidence link"
      });
    }

    // Prepare assessment data
    // New assessments always start as 'draft'
    const assessmentData = {
      ai_system_id: aiSystemId,
      category: body.category,
      summary: body.summary,
      metrics: body.metrics || {},
      risk_level: body.risk_level,
      mitigation_status: body.mitigation_status || 'not_started',
      status: 'draft', // Always start as draft
      assessed_by: userId,
      // TEMPORARY: org_id currently maps 1:1 to user_id.
      // This will change when true organizations are introduced.
      org_id: userId,
      evidence_links: body.evidence_links || [],
    };

    // Insert risk assessment
    const { data: assessment, error: insertError } = await supabase
      .from("risk_assessments")
      .insert([assessmentData])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating risk assessment:", insertError);
      // Provide more detailed error information
      const errorMessage = insertError.message || "Unknown database error";
      const errorCode = insertError.code || "UNKNOWN";

      // Check if it's a column not found error (migration not run)
      if (errorCode === 'PGRST204' || errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        return res.status(500).json({
          error: "Database schema error: Missing 'status' column. Please run the migration: supabase/migrations/add_risk_assessment_workflow.sql",
          details: errorMessage,
          code: errorCode
        });
      }

      return res.status(500).json({
        error: "Failed to create risk assessment",
        details: errorMessage,
        code: errorCode
      });
    }

    return res.status(201).json(assessment);
  } catch (error: any) {
    console.error("POST /api/ai-systems/[id]/risk-assessments error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/ai-systems/[id]/risk-mitigations
 * Generate risk mitigation suggestions for an AI system
 */
export async function postRiskMitigations(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const { risk_factors } = req.body;

    // Validate required fields
    if (!risk_factors || !Array.isArray(risk_factors) || risk_factors.length === 0) {
      return res.status(400).json({ error: "Risk factors array is required" });
    }


    // Get system information
    const [
      { data: euData },
      { data: ukData },
      { data: masData },
      { data: registryData }
    ] = await Promise.all([
      supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("ai_system_registry").select("*").eq("system_id", systemId).maybeSingle()
    ]);

    // Determine system context
    let systemData: any = null;
    let regulationType = 'EU';

    if (euData) {
      systemData = euData;
      regulationType = 'EU';
    } else if (ukData) {
      systemData = ukData;
      regulationType = 'UK';
    } else if (masData) {
      systemData = masData;
      regulationType = 'MAS';
    } else if (registryData) {
      systemData = registryData;
      regulationType = 'EU';
    }

    if (!systemData) {
      return res.status(404).json({ error: "AI system not found" });
    }

    const systemContext = {
      id: systemId,
      name: systemData.system_name || systemData.name || `System ${systemId}`,
      risk_level: systemData.risk_tier || systemData.risk_classification || 'medium',
      regulation_type: regulationType
    };

    console.log(`[API] Generating risk mitigation suggestions for system ${systemId}`);

    // Generate mitigation suggestions using RAG
    const mitigationSuggestions = await suggestRiskMitigations(
      risk_factors,
      systemContext,
      userId
    );

    // Group suggestions by risk category
    const suggestionsByCategory = mitigationSuggestions.reduce((acc, suggestion) => {
      const category = suggestion.risk_category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(suggestion);
      return acc;
    }, {});

    // Calculate summary statistics
    const summaryStats = {
      total_suggestions: mitigationSuggestions.length,
      by_severity: {
        critical: mitigationSuggestions.filter(s => s.severity === 'critical').length,
        high: mitigationSuggestions.filter(s => s.severity === 'high').length,
        medium: mitigationSuggestions.filter(s => s.severity === 'medium').length,
        low: mitigationSuggestions.filter(s => s.severity === 'low').length
      },
      by_category: {
        technical: mitigationSuggestions.filter(s => s.risk_category === 'technical').length,
        operational: mitigationSuggestions.filter(s => s.risk_category === 'operational').length,
        legal_regulatory: mitigationSuggestions.filter(s => s.risk_category === 'legal_regulatory').length,
        ethical_societal: mitigationSuggestions.filter(s => s.risk_category === 'ethical_societal').length,
        business: mitigationSuggestions.filter(s => s.risk_category === 'business').length
      }
    };

    return res.status(200).json({
      mitigation_suggestions: mitigationSuggestions,
      suggestions_by_category: suggestionsByCategory,
      system: systemContext,
      summary_stats: summaryStats,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error generating risk mitigation suggestions:", error);
    return res.status(500).json({
      error: "Failed to generate risk mitigation suggestions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * GET /api/ai-systems/[id]/risk-trends
 * Analyze risk trends for an AI system over time
 */
export async function getRiskTrends(req: Request, res: Response) {
  try {
      const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const includeIndustryBenchmarks = req.query.include_benchmarks === 'true';


    // Fetch historical risk assessments for this system
    const { data: historicalAssessments, error: historyError } = await supabase
      .from("automated_risk_assessments")
      .select(`
        assessed_at,
        overall_risk_level,
        composite_score,
        technical_risk_score,
        operational_risk_score,
        legal_regulatory_risk_score,
        ethical_societal_risk_score,
        business_risk_score,
        executive_summary
      `)
      .eq("ai_system_id", systemId)
      .order("assessed_at", { ascending: true });

    if (historyError) {
      console.error("Error fetching historical assessments:", historyError);
      return res.status(500).json({
        error: "Failed to fetch historical assessments",
        details: historyError.message
      });
    }

    if (!historicalAssessments || historicalAssessments.length < 2) {
      return res.status(200).json({
        trend_analysis: {
          system_id: systemId,
          historical_assessments: historicalAssessments?.map(h => ({
            assessment_date: h.assessed_at,
            overall_risk_level: h.overall_risk_level,
            composite_score: h.composite_score,
            key_changes: [h.executive_summary?.substring(0, 100) + '...' || 'No summary available']
          })) || [],
          trend_direction: 'stable',
          trend_confidence: 50,
          risk_drivers: [],
          predictions: {
            next_review_risk_level: historicalAssessments?.[historicalAssessments.length - 1]?.overall_risk_level || 'Medium',
            confidence: 50,
            key_factors: []
          },
          recommendations: [
            {
              priority: 'medium',
              action: 'Continue regular risk assessments to establish trend patterns',
              rationale: 'Insufficient historical data for comprehensive trend analysis'
            }
          ]
        },
        message: "Insufficient historical data for trend analysis. At least 2 assessments required.",
        assessments_found: historicalAssessments?.length || 0
      });
    }

    // Transform historical data for trend analysis
    const systemHistory = historicalAssessments.map(assessment => ({
      assessment_date: assessment.assessed_at,
      overall_risk_level: assessment.overall_risk_level,
      composite_score: assessment.composite_score,
      dimension_scores: {
        technical: assessment.technical_risk_score,
        operational: assessment.operational_risk_score,
        legal_regulatory: assessment.legal_regulatory_risk_score,
        ethical_societal: assessment.ethical_societal_risk_score,
        business: assessment.business_risk_score
      },
      key_changes: [assessment.executive_summary?.substring(0, 200) + '...' || 'No summary available']
    }));

    // Fetch industry benchmarks if requested
    let industryBenchmarks;
    if (includeIndustryBenchmarks) {
      try {
        // Calculate industry averages from all systems (simplified approach)
        const { data: industryData } = await supabase
          .from("automated_risk_assessments")
          .select("composite_score, overall_risk_level, assessed_at")
          .gte("assessed_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
          .limit(1000);

        if (industryData && industryData.length > 0) {
          const averageScore = industryData.reduce((sum, item) => sum + item.composite_score, 0) / industryData.length;

          // Simple trend calculation
          const recentData = industryData.slice(-Math.floor(industryData.length / 2));
          const olderData = industryData.slice(0, Math.floor(industryData.length / 2));
          const recentAvg = recentData.reduce((sum, item) => sum + item.composite_score, 0) / recentData.length;
          const olderAvg = olderData.reduce((sum, item) => sum + item.composite_score, 0) / olderData.length;

          let trendDirection: 'improving' | 'stable' | 'deteriorating' = 'stable';
          if (recentAvg < olderAvg - 0.3) trendDirection = 'improving';
          else if (recentAvg > olderAvg + 0.3) trendDirection = 'deteriorating';

          industryBenchmarks = {
            average_risk_score: Math.round(averageScore * 100) / 100,
            trend_direction: trendDirection,
            common_factors: ['Regulatory compliance', 'Data privacy', 'Model interpretability']
          };
        }
      } catch (error) {
        console.error('Error fetching industry benchmarks:', error);
        industryBenchmarks = undefined;
      }
    }

    console.log(`[API] Analyzing risk trends for system ${systemId} with ${systemHistory.length} assessments`);

    // Analyze risk trends using RAG
    const trendAnalysis = await analyzeRiskTrends(
      systemId,
      systemHistory,
      industryBenchmarks,
      userId
    );

    // Calculate additional trend metrics
    const trendMetrics = {
      assessment_frequency: {
        total_assessments: systemHistory.length,
        date_range: {
          first_assessment: systemHistory[0].assessment_date,
          latest_assessment: systemHistory[systemHistory.length - 1].assessment_date
        },
        average_interval_days: systemHistory.length > 1 ?
          Math.round((new Date(systemHistory[systemHistory.length - 1].assessment_date).getTime() -
                     new Date(systemHistory[0].assessment_date).getTime()) /
                    (1000 * 60 * 60 * 24) / (systemHistory.length - 1)) : 0
      },
      score_progression: {
        initial_score: systemHistory[0].composite_score,
        current_score: systemHistory[systemHistory.length - 1].composite_score,
        change: Math.round((systemHistory[systemHistory.length - 1].composite_score - systemHistory[0].composite_score) * 100) / 100,
        percentage_change: Math.round(((systemHistory[systemHistory.length - 1].composite_score - systemHistory[0].composite_score) / systemHistory[0].composite_score) * 10000) / 100
      }
    };

    return res.status(200).json({
      trend_analysis: trendAnalysis,
      trend_metrics: trendMetrics,
      industry_benchmarks: industryBenchmarks,
      analyzed_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error analyzing risk trends:", error);
    return res.status(500).json({
      error: "Failed to analyze risk trends",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/ai-systems/[id]/smart-risk-assessment
 * Generate a contextual smart risk assessment for an AI system
 */
export async function postSmartRiskAssessment(req: Request, res: Response) {
  try {
        const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const { include_organization_history = false } = req.body;


    // Gather comprehensive system data
    const [
      { data: euData },
      { data: ukData },
      { data: masData },
      { data: registryData }
    ] = await Promise.all([
      supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("ai_system_registry").select("*").eq("system_id", systemId).maybeSingle()
    ]);

    // Determine primary system data and regulation type
    let systemData: any = null;
    let regulationType = 'EU';

    if (euData) {
      systemData = euData;
      regulationType = 'EU';
    } else if (ukData) {
      systemData = ukData;
      regulationType = 'UK';
    } else if (masData) {
      systemData = masData;
      regulationType = 'MAS';
    } else if (registryData) {
      systemData = registryData;
      regulationType = 'EU'; // Default
    }

    if (!systemData) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Prepare system data for assessment
    const assessmentSystemData = {
      id: systemId,
      name: systemData.system_name || systemData.name || `System ${systemId}`,
      description: systemData.system_description || systemData.description || '',
      risk_tier: systemData.risk_tier || systemData.risk_classification || 'medium',
      lifecycle_stage: systemData.lifecycle_stage || 'Draft',
      regulation_type: regulationType,
      compliance_status: systemData.compliance_status || systemData.overall_assessment || systemData.overall_compliance_status || 'Unknown',
      ...systemData
    };

    // Fetch organization history if requested
    let organizationHistory;
    if (include_organization_history) {
      try {
        const { data: previousAssessments } = await supabase
          .from("automated_risk_assessments")
          .select("assessed_at, overall_risk_level, executive_summary")
          .eq("ai_system_id", systemId)
          .order("assessed_at", { ascending: false })
          .limit(5);

        organizationHistory = {
          previous_assessments: previousAssessments?.map(assessment => ({
            date: assessment.assessed_at,
            risk_level: assessment.overall_risk_level,
            key_findings: [assessment.executive_summary?.substring(0, 200) + '...' || 'No summary available']
          })) || [],
          industry_benchmarks: {
            average_risk_score: 5.5,
            common_risk_factors: ['Data privacy concerns', 'Model interpretability', 'Regulatory compliance']
          }
        };
      } catch (error) {
        console.error('Error fetching organization history:', error);
        organizationHistory = undefined;
      }
    }

    console.log(`[API] Generating smart risk assessment for system ${systemId} (${regulationType})`);

    // Generate contextual risk assessment using RAG
    const contextualAssessment = await generateContextualRiskAssessment(
      assessmentSystemData,
      userId,
      organizationHistory
    );

    // Save the assessment to database
    const { data: savedAssessment, error: saveError } = await supabase
      .from("automated_risk_assessments")
      .insert({
        ai_system_id: systemId,
        technical_risk_score: contextualAssessment.technical_risk_score,
        operational_risk_score: contextualAssessment.operational_risk_score,
        legal_regulatory_risk_score: contextualAssessment.legal_regulatory_risk_score,
        ethical_societal_risk_score: contextualAssessment.ethical_societal_risk_score,
        business_risk_score: contextualAssessment.business_risk_score,
        composite_score: contextualAssessment.composite_score,
        overall_risk_level: contextualAssessment.overall_risk_level,
        weights: contextualAssessment.weights,
        dimension_details: contextualAssessment.dimension_details,
        executive_summary: contextualAssessment.executive_summary,
        detailed_findings: contextualAssessment.detailed_findings,
        compliance_checklist: contextualAssessment.compliance_checklist,
        remediation_plan: contextualAssessment.remediation_plan,
        re_assessment_timeline: contextualAssessment.re_assessment_timeline,
        assessed_by: userId,
        trigger_type: contextualAssessment.trigger_type,
        data_sources: contextualAssessment.data_sources
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving assessment:', saveError);
      // Continue anyway, return the assessment even if save failed
    }

    return res.status(200).json({
      assessment: {
        ...contextualAssessment,
        id: savedAssessment?.id || 'temp-id',
        assessed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      system: {
        id: systemId,
        name: assessmentSystemData.name,
        regulation_type: regulationType,
        risk_tier: assessmentSystemData.risk_tier
      },
      context_quality: contextualAssessment.context_sources,
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error generating smart risk assessment:", error);
    return res.status(500).json({
      error: "Failed to generate smart risk assessment",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/ai-systems/[id]/transition-plan
 * Generate a transition plan for lifecycle stage changes
 */
export async function postTransitionPlan(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const { from_stage, to_stage, readiness_assessment } = req.body;

    // Validate required fields
    if (!from_stage || !to_stage) {
      return res.status(400).json({ error: "Both from_stage and to_stage are required" });
    }

    if (!readiness_assessment) {
      return res.status(400).json({ error: "Readiness assessment is required for transition planning" });
    }

    // Validate stages
    const validStages = ['Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'];
    if (!validStages.includes(from_stage) || !validStages.includes(to_stage)) {
      return res.status(400).json({
        error: `Invalid stage. Must be one of: ${validStages.join(', ')}`
      });
    }

    if (from_stage === to_stage) {
      return res.status(400).json({ error: "From stage and to stage cannot be the same" });
    }


    // Get system data from multiple sources
    const [
      { data: euData },
      { data: ukData },
      { data: masData },
      { data: registryData }
    ] = await Promise.all([
      supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("ai_system_registry").select("*").eq("system_id", systemId).maybeSingle()
    ]);

    // Determine primary system data and regulation type
    let systemData: any = null;
    let regulationType = 'EU';

    if (euData) {
      systemData = euData;
      regulationType = 'EU';
    } else if (ukData) {
      systemData = ukData;
      regulationType = 'UK';
    } else if (masData) {
      systemData = masData;
      regulationType = 'MAS';
    } else if (registryData) {
      systemData = registryData;
      regulationType = 'EU'; // Default
    }

    if (!systemData) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Prepare system data for planning
    const planningSystemData = {
      id: systemId,
      name: systemData.system_name || systemData.name || `System ${systemId}`,
      description: systemData.system_description || systemData.description || '',
      risk_tier: systemData.risk_tier || systemData.risk_classification || 'medium',
      regulation_type: regulationType
    };

    console.log(`[API] Generating transition plan for system ${systemId} from ${from_stage} to ${to_stage}`);

    // Generate transition plan using RAG
    const transitionPlan = await generateTransitionPlan(
      planningSystemData,
      from_stage,
      to_stage,
      readiness_assessment,
      userId
    );

    // Calculate plan metrics
    const planMetrics = {
      total_phases: transitionPlan.phases.length,
      total_activities: transitionPlan.phases.reduce((sum, phase) => sum + phase.activities.length, 0),
      total_milestones: transitionPlan.phases.reduce((sum, phase) => sum + phase.milestones.length, 0),
      total_risks: transitionPlan.phases.reduce((sum, phase) => sum + phase.risks.length, 0),
      activities_by_priority: {
        immediate: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.priority === 'immediate').length, 0),
        high: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.priority === 'high').length, 0),
        medium: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.priority === 'medium').length, 0),
        low: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.priority === 'low').length, 0)
      },
      activities_by_category: {
        regulatory: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.category === 'regulatory').length, 0),
        technical: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.category === 'technical').length, 0),
        process: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.category === 'process').length, 0),
        documentation: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.category === 'documentation').length, 0),
        governance: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.activities.filter(a => a.category === 'governance').length, 0)
      },
      risks_by_impact: {
        high: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.risks.filter(r => r.impact === 'high').length, 0),
        medium: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.risks.filter(r => r.impact === 'medium').length, 0),
        low: transitionPlan.phases.reduce((sum, phase) =>
          sum + phase.risks.filter(r => r.impact === 'low').length, 0)
      }
    };

    // Generate implementation recommendations
    const implementationRecommendations = [];

    if (planMetrics.activities_by_priority.immediate > 0) {
      implementationRecommendations.push('Focus on immediate priority activities first to address critical blockers');
    }

    if (planMetrics.risks_by_impact.high > 0) {
      implementationRecommendations.push('Develop detailed mitigation strategies for high-impact risks');
    }

    if (transitionPlan.resource_requirements.external_support_needed) {
      implementationRecommendations.push('Secure external support early in the transition process');
    }

    if (planMetrics.activities_by_category.regulatory > planMetrics.total_activities * 0.3) {
      implementationRecommendations.push('Consider involving regulatory compliance experts throughout the transition');
    }

    return res.status(200).json({
      transition_plan: transitionPlan,
      system: {
        id: systemId,
        name: planningSystemData.name,
        regulation_type: regulationType
      },
      transition_details: {
        from_stage: from_stage,
        to_stage: to_stage,
        strategy: transitionPlan.transition_strategy,
        estimated_timeline: transitionPlan.estimated_timeline
      },
      plan_metrics: planMetrics,
      implementation_recommendations: implementationRecommendations,
      critical_success_factors: [
        'Stakeholder alignment and communication',
        'Resource availability and allocation',
        'Risk mitigation execution',
        'Regulatory compliance verification',
        'Milestone achievement tracking'
      ],
      generated_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error generating transition plan:", error);
    return res.status(500).json({
      error: "Failed to generate transition plan",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/ai-systems/[id]/transition-readiness
 * Assess readiness for lifecycle stage transition
 */
export async function postTransitionReadiness(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const { target_stage } = req.body;

    // Validate required fields
    if (!target_stage) {
      return res.status(400).json({ error: "Target stage is required" });
    }

    // Validate target stage
    const validStages = ['Draft', 'Development', 'Testing', 'Deployed', 'Monitoring', 'Retired'];
    if (!validStages.includes(target_stage)) {
      return res.status(400).json({
        error: `Invalid target stage. Must be one of: ${validStages.join(', ')}`
      });
    }


    // Get system data from multiple sources
    const [
      { data: euData },
      { data: ukData },
      { data: masData },
      { data: registryData }
    ] = await Promise.all([
      supabase.from("eu_ai_act_check_results").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("uk_ai_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("mas_ai_risk_assessments").select("*").eq("id", systemId).maybeSingle(),
      supabase.from("ai_system_registry").select("*").eq("system_id", systemId).maybeSingle()
    ]);

    // Determine primary system data and regulation type
    let systemData: any = null;
    let regulationType = 'EU';

    if (euData) {
      systemData = euData;
      regulationType = 'EU';
    } else if (ukData) {
      systemData = ukData;
      regulationType = 'UK';
    } else if (masData) {
      systemData = masData;
      regulationType = 'MAS';
    } else if (registryData) {
      systemData = registryData;
      regulationType = 'EU'; // Default
    }

    if (!systemData) {
      return res.status(404).json({ error: "AI system not found" });
    }

    // Prepare system data for assessment
    const assessmentSystemData = {
      id: systemId,
      name: systemData.system_name || systemData.name || `System ${systemId}`,
      description: systemData.system_description || systemData.description || '',
      risk_tier: systemData.risk_tier || systemData.risk_classification || 'medium',
      current_stage: systemData.lifecycle_stage || 'Draft',
      regulation_type: regulationType,
      compliance_status: systemData.compliance_status || systemData.overall_assessment || systemData.overall_compliance_status || 'Unknown',
      ...systemData
    };

    // Validate that target stage is different from current stage
    if (assessmentSystemData.current_stage === target_stage) {
      return res.status(400).json({
        error: `System is already in ${target_stage} stage`
      });
    }

    console.log(`[API] Assessing transition readiness for system ${systemId} from ${assessmentSystemData.current_stage} to ${target_stage}`);

    // Assess transition readiness using RAG
    const readinessAssessment = await assessTransitionReadiness(
      assessmentSystemData,
      target_stage,
      userId
    );

    // Calculate additional metrics
    const assessmentMetrics = {
      total_criteria: readinessAssessment.readiness_criteria.length,
      criteria_status: {
        met: readinessAssessment.readiness_criteria.filter(c => c.status === 'met').length,
        partially_met: readinessAssessment.readiness_criteria.filter(c => c.status === 'partially_met').length,
        not_met: readinessAssessment.readiness_criteria.filter(c => c.status === 'not_met').length,
        not_applicable: readinessAssessment.readiness_criteria.filter(c => c.status === 'not_applicable').length
      },
      regulatory_requirements: {
        total: readinessAssessment.regulatory_requirements.length,
        compliant: readinessAssessment.regulatory_requirements.filter(r => r.status === 'compliant').length,
        non_compliant: readinessAssessment.regulatory_requirements.filter(r => r.status === 'non_compliant').length,
        mandatory: readinessAssessment.regulatory_requirements.filter(r => r.mandatory).length
      },
      blockers: {
        total: readinessAssessment.blockers.length,
        by_severity: {
          critical: readinessAssessment.blockers.filter(b => b.severity === 'critical').length,
          high: readinessAssessment.blockers.filter(b => b.severity === 'high').length,
          medium: readinessAssessment.blockers.filter(b => b.severity === 'medium').length,
          low: readinessAssessment.blockers.filter(b => b.severity === 'low').length
        },
        by_type: {
          regulatory: readinessAssessment.blockers.filter(b => b.blocker_type === 'regulatory').length,
          technical: readinessAssessment.blockers.filter(b => b.blocker_type === 'technical').length,
          process: readinessAssessment.blockers.filter(b => b.blocker_type === 'process').length,
          documentation: readinessAssessment.blockers.filter(b => b.blocker_type === 'documentation').length,
          governance: readinessAssessment.blockers.filter(b => b.blocker_type === 'governance').length
        }
      },
      recommendations: {
        total: readinessAssessment.recommendations.length,
        by_priority: {
          immediate: readinessAssessment.recommendations.filter(r => r.priority === 'immediate').length,
          high: readinessAssessment.recommendations.filter(r => r.priority === 'high').length,
          medium: readinessAssessment.recommendations.filter(r => r.priority === 'medium').length,
          low: readinessAssessment.recommendations.filter(r => r.priority === 'low').length
        }
      }
    };

    // Determine if transition is recommended
    const transitionRecommended = readinessAssessment.overall_readiness === 'ready' ||
                                 readinessAssessment.overall_readiness === 'mostly_ready';

    return res.status(200).json({
      readiness_assessment: readinessAssessment,
      system: {
        id: systemId,
        name: assessmentSystemData.name,
        current_stage: assessmentSystemData.current_stage,
        target_stage: target_stage,
        regulation_type: regulationType
      },
      assessment_metrics: assessmentMetrics,
      transition_recommendation: {
        recommended: transitionRecommended,
        rationale: transitionRecommended ?
          'System meets readiness criteria for transition' :
          'System has blockers that should be resolved before transition',
        next_steps: transitionRecommended ?
          ['Proceed with transition planning', 'Schedule transition activities'] :
          ['Address identified blockers', 'Re-assess readiness after blocker resolution']
      },
      assessed_at: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("[API] Error assessing transition readiness:", error);
    return res.status(500).json({
      error: "Failed to assess transition readiness",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/ai-systems/[id]/documentation
 * Generate new documentation for an AI system
 */
export async function postDocumentation(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}

    const { id: systemId } = req.params;
    const body = req.body;
    let { regulation_type, document_type }: { regulation_type?: RegulationType; document_type?: string } = body;

    // Default to Compliance Summary if not specified
    if (!document_type) {
      document_type = 'Compliance Summary';
    }


    // Smart Default: Auto-detect regulation type if not provided
    if (!regulation_type) {
      // Check which tables have this system ID
      const [euCheck, ukCheck, masCheck] = await Promise.all([
        supabase.from("eu_ai_act_check_results").select("id").eq("id", systemId).maybeSingle(),
        supabase.from("uk_ai_assessments").select("id").eq("id", systemId).maybeSingle(),
        supabase.from("mas_ai_risk_assessments").select("id").eq("id", systemId).maybeSingle(),
      ]);

      if (euCheck.data) {
        regulation_type = 'EU AI Act';
      } else if (ukCheck.data) {
        regulation_type = 'UK AI Act';
      } else if (masCheck.data) {
        regulation_type = 'MAS';
      } else {
        return res.status(404).json({
          error: "No assessment found for this system. Please specify regulation_type."
        });
      }
    }

    // Validate regulation type
    if (!['EU AI Act', 'UK AI Act', 'MAS'].includes(regulation_type)) {
      return res.status(400).json({
        error: "Invalid regulation_type. Must be 'EU AI Act', 'UK AI Act', or 'MAS'"
      });
    }

    // Gather system data based on regulation type
    const systemData = await gatherSystemData(supabase, systemId, regulation_type);

    if (!systemData) {
      return res.status(404).json({
        error: `No ${regulation_type} assessment found for this system`
      });
    }

    // Get approved risk assessments (only approved status)
    const { data: riskAssessments } = await supabase
      .from("risk_assessments")
      .select("*")
      .eq("ai_system_id", systemId)
      .eq("status", "approved")
      .order("assessed_at", { ascending: false });

    // Get latest risk assessment version for traceability
    const latestRiskAssessment = riskAssessments && riskAssessments.length > 0
      ? riskAssessments[0]
      : null;
    const riskAssessmentVersion = latestRiskAssessment?.version || 'N/A';

    // Get AI system version (if available from registry or metadata)
    const aiSystemVersion = systemData.version || 'N/A';

    // Generate documentation using LLM
    if (!openai) {
      return res.status(500).json({ error: "OpenAI service not available" });
    }

    const documentation = await generateDocumentation(
      regulation_type,
      document_type,
      systemData,
      riskAssessments || [],
      {
        aiSystemVersion,
        riskAssessmentVersion,
        systemId
      }
    );

    // Determine next version (per document type)
    const { data: existingDocs } = await supabase
      .from("compliance_documentation")
      .select("version")
      .eq("ai_system_id", systemId)
      .eq("regulation_type", regulation_type)
      .eq("document_type", document_type)
      .order("created_at", { ascending: false })
      .limit(1);

    let nextVersion = "1.0";
    if (existingDocs && existingDocs.length > 0) {
      const latestVersion = existingDocs[0].version;
      const [major, minor] = latestVersion.split('.').map(Number);
      nextVersion = `${major}.${minor + 1}`;
    }

    // Mark old documents of the same type as outdated
    await supabase
      .from("compliance_documentation")
      .update({ status: "outdated" })
      .eq("ai_system_id", systemId)
      .eq("regulation_type", regulation_type)
      .eq("document_type", document_type)
      .eq("status", "current");

    // Collect evidence references
    const riskScores: Record<string, number> = {};
    const biasMetrics: Record<string, any> = {};

    if (riskAssessments && riskAssessments.length > 0) {
      riskAssessments.forEach((ra: any) => {
        if (ra.risk_score) {
          riskScores[ra.category || 'unknown'] = ra.risk_score;
        }
        if (ra.bias_metrics) {
          biasMetrics[ra.category || 'unknown'] = ra.bias_metrics;
        }
      });
    }

    // Store generation metadata for change detection and evidence
    const generationMetadata = {
      system_data_hash: JSON.stringify(systemData).length, // Simple hash
      risk_assessments_count: riskAssessments?.length || 0,
      generated_at: new Date().toISOString(),
      risk_scores: Object.keys(riskScores).length > 0 ? riskScores : undefined,
      bias_metrics: Object.keys(biasMetrics).length > 0 ? biasMetrics : undefined,
    };

    // Save new documentation
    const { data: newDoc, error: insertError } = await supabase
      .from("compliance_documentation")
      .insert({
        ai_system_id: systemId,
        regulation_type,
        document_type,
        version: nextVersion,
        content: documentation,
        status: "current",
        created_by: userId,
        // TEMPORARY: org_id currently maps 1:1 to user_id.
        // This will change when true organizations are introduced.
        org_id: userId,
        ai_system_version: aiSystemVersion !== 'N/A' ? aiSystemVersion : null,
        risk_assessment_version: riskAssessmentVersion !== 'N/A' ? riskAssessmentVersion : null,
        generation_metadata: generationMetadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving documentation:", insertError);
      return res.status(500).json({ error: "Failed to save documentation" });
    }

    return res.status(201).json({ documentation: newDoc });
  } catch (error: any) {
    console.error("POST /api/ai-systems/[id]/documentation error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * GET /api/ai-systems/[id]/compliance-data
 * Get compliance data for an AI system from all compliance tables
 */
export async function getComplianceData(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const { id: systemId } = req.params;

    // Check all three compliance tables for this system ID
    const [euResult, masResult, ukResult] = await Promise.all([
      // EU AI Act Compliance
      supabase
        .from("eu_ai_act_check_results")
        .select("*")
        .eq("id", systemId)
        .maybeSingle(),

      // MAS
      supabase
        .from("mas_ai_risk_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle(),

      // UK AI Act
      supabase
        .from("uk_ai_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle(),
    ]);

    // Get lifecycle stage from whichever table has the system
    const lifecycleStage =
      (euResult.data as any)?.lifecycle_stage ||
      (masResult.data as any)?.lifecycle_stage ||
      (ukResult.data as any)?.lifecycle_stage ||
      'Draft';

    const complianceData = {
      eu: euResult.data || null,
      mas: masResult.data || null,
      uk: ukResult.data || null,
    };

    // Determine which regulation this system belongs to
    let systemInfo = null;
    if (euResult.data) {
      systemInfo = {
        type: "EU AI Act",
        name: (euResult.data as any).system_name || "Unnamed System",
        id: systemId,
        created_at: euResult.data.created_at,
        accountable_person: (euResult.data as any).accountable_person || "Not specified",
        lifecycle_stage: lifecycleStage,
      };
    } else if (masResult.data) {
      systemInfo = {
        type: "MAS",
        name: (masResult.data as any).system_name || "Unnamed System",
        id: systemId,
        created_at: (masResult.data as any).created_at || new Date().toISOString(),
        accountable_person: (masResult.data as any).owner || "Not specified",
        lifecycle_stage: lifecycleStage,
      };
    } else if (ukResult.data) {
      systemInfo = {
        type: "UK AI Act",
        name: (ukResult.data as any).system_name || "Unnamed System",
        id: systemId,
        created_at: ukResult.data.created_at || new Date().toISOString(),
        accountable_person: (ukResult.data as any).accountable_person || "Not specified",
        lifecycle_stage: lifecycleStage,
      };
    }

    return res.status(200).json({
      systemInfo,
      complianceData,
    });
  } catch (error: any) {
    console.error("GET /api/ai-systems/[id]/compliance-data error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * Gather system data based on regulation type
 */
async function gatherSystemData(
  supabase: any,
  systemId: string,
  regulationType: RegulationType
): Promise<any | null> {
  let query;

  switch (regulationType) {
    case 'EU AI Act':
      query = supabase
        .from("eu_ai_act_check_results")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
    case 'UK AI Act':
      query = supabase
        .from("uk_ai_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
    case 'MAS':
      query = supabase
        .from("mas_ai_risk_assessments")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      break;
  }

  const { data, error } = await query;
  if (error || !data) {
    return null;
  }

  // Get lifecycle stage if EU AI Act
  if (regulationType === 'EU AI Act') {
    return {
      ...data,
      lifecycle_stage: data.lifecycle_stage || 'Draft',
    };
  }

  return data;
}

/**
 * Generate documentation using OpenAI with RAG-enhanced regulatory context
 */
async function generateDocumentation(
  regulationType: RegulationType,
  documentType: string,
  systemData: any,
  riskAssessments: any[],
  traceability: {
    aiSystemVersion: string;
    riskAssessmentVersion: string;
    systemId: string;
  }
): Promise<string> {
  // Get RAG-enhanced regulatory context
  let regulatoryContext = '';
  try {
    // Map documentation regulation types to RAG regulation types
    const ragRegulationType: any = regulationType === 'EU AI Act' ? 'EU'
      : regulationType === 'UK AI Act' ? 'UK'
      : 'MAS';

    // Build RAG query based on system characteristics and document type
    const ragQuery = `${documentType} documentation requirements ${systemData?.system_name || ''} ${systemData?.risk_tier || systemData?.risk_level || ''} compliance obligations`;

    console.log(`[Doc RAG] Querying ${ragRegulationType} regulation RAG for documentation generation`);
    regulatoryContext = await getRegulationContextString(ragQuery, ragRegulationType, 8);

    if (regulatoryContext &&
        regulatoryContext !== 'No relevant context found.' &&
        regulatoryContext !== 'No query provided.') {
      console.log(`[Doc RAG] Retrieved ${regulatoryContext.length} chars of regulatory context`);
    } else {
      console.log(`[Doc RAG] No specific regulatory context found, using general knowledge`);
      regulatoryContext = '';
    }
  } catch (ragError) {
    console.error('[Doc RAG] Error retrieving regulatory context:', ragError);
    regulatoryContext = '';
  }

  if (!openai) {
    throw new Error("OpenAI service not available");
  }

  const prompt = buildPrompt(regulationType, documentType, systemData, riskAssessments, traceability, regulatoryContext);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert compliance documentation writer. Generate comprehensive, professional compliance documentation based on the provided system data, risk assessments, and regulatory context. Always include specific regulatory references and traceability information where available. Use the regulatory context to ensure accuracy and completeness.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content || "Failed to generate documentation";
}

/**
 * Build regulation and document-type-specific prompt with RAG regulatory context
 */
function buildPrompt(
  regulationType: RegulationType,
  documentType: string,
  systemData: any,
  riskAssessments: any[],
  traceability: {
    aiSystemVersion: string;
    riskAssessmentVersion: string;
    systemId: string;
  },
  regulatoryContext?: string
): string {
  const riskSummary = riskAssessments.map(ra => {
    let line = `- ${ra.category}: ${ra.risk_level} risk - ${ra.summary} (Mitigation: ${ra.mitigation_status})`;
    if (ra.risk_score) line += ` [Risk Score: ${ra.risk_score}]`;
    if (ra.assessed_at) line += ` [Assessed: ${new Date(ra.assessed_at).toLocaleDateString()}]`;
    return line;
  }).join('\n');

  // Build evidence references
  const evidenceRefs: string[] = [];
  riskAssessments.forEach((ra: any) => {
    if (ra.risk_score) {
      evidenceRefs.push(`Risk score for ${ra.category}: ${ra.risk_score} (from Risk Assessment ${ra.id?.substring(0, 8) || 'N/A'})`);
    }
    if (ra.bias_metrics) {
      evidenceRefs.push(`Bias metrics for ${ra.category}: ${JSON.stringify(ra.bias_metrics)}`);
    }
  });

  // Build regulatory context section
  const regulatoryContextSection = regulatoryContext ? `
## Regulatory Context

The following regulatory requirements and obligations are relevant to this documentation:

${regulatoryContext}

**Important:** Use this regulatory context to ensure the documentation accurately reflects specific regulatory requirements and obligations. Reference specific articles, sections, or requirements where applicable.

---

` : '';

  // Build traceability header
  const traceabilityHeader = `
## Document Traceability

This document was generated with the following version information:
- AI System ID: ${traceability.systemId}
- AI System Version: ${traceability.aiSystemVersion}
- Risk Assessment Version: ${traceability.riskAssessmentVersion}
- Regulation: ${regulationType}
- Document Type: ${documentType}
- Generated: ${new Date().toISOString()}
- RAG Context: ${regulatoryContext ? 'Enhanced with regulatory knowledge base' : 'General knowledge only'}

## Evidence References

${evidenceRefs.length > 0 ? evidenceRefs.join('\n') : 'No specific evidence references available.'}

---

`;

  // Route to document-type-specific builder
  switch (documentType) {
    case 'AI System Card':
      return regulatoryContextSection + traceabilityHeader + buildModelCardPrompt(regulationType, systemData, riskSummary);
    case 'Technical Documentation':
      return regulatoryContextSection + traceabilityHeader + buildTechnicalDocPrompt(regulationType, systemData, riskSummary);
    case 'Data Protection Impact Assessment':
      return regulatoryContextSection + traceabilityHeader + buildDPIAPrompt(regulationType, systemData, riskSummary);
    case 'Risk Assessment Report':
      return regulatoryContextSection + traceabilityHeader + buildRiskReportPrompt(regulationType, systemData, riskSummary);
    case 'Algorithm Impact Assessment':
      return regulatoryContextSection + traceabilityHeader + buildAlgorithmImpactPrompt(regulationType, systemData, riskSummary);
    case 'Audit Trail':
      return regulatoryContextSection + traceabilityHeader + buildAuditTrailPrompt(regulationType, systemData, riskSummary);
    case 'Compliance Summary':
    default:
      // Use existing regulation-specific prompts with RAG context
      switch (regulationType) {
        case 'EU AI Act':
          return regulatoryContextSection + traceabilityHeader + buildEUAIActPrompt(systemData, riskSummary);
        case 'UK AI Act':
          return regulatoryContextSection + traceabilityHeader + buildUKAIActPrompt(systemData, riskSummary);
        case 'MAS':
          return regulatoryContextSection + traceabilityHeader + buildMASPrompt(systemData, riskSummary);
      }
  }
}

// Helper prompt builders (simplified versions)
function buildEUAIActPrompt(systemData: any, riskSummary: string): string {
  return `Generate technical documentation for an AI system aligned with EU AI Act Article 11 requirements.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Risk Tier: ${systemData.risk_tier || 'Unknown'}
- Compliance Status: ${systemData.compliance_status || 'Unknown'}
- Lifecycle Stage: ${systemData.lifecycle_stage || 'Draft'}
- Accountable Person: ${systemData.accountable_person || 'Not specified'}

Risk Assessments (Approved):
${riskSummary || 'No approved risk assessments'}

Generate comprehensive technical documentation that includes:
1. System Overview and Purpose
2. Risk Classification and Justification
3. Technical Specifications
4. Data Governance and Quality Measures
5. Risk Management System
6. Human Oversight Mechanisms
7. Accuracy, Robustness, and Cybersecurity Measures
8. Transparency and User Information
9. Post-Market Monitoring Plan (if applicable)
10. Compliance Summary

Format the document professionally with clear sections and subsections. Use markdown formatting.`;
}

function buildUKAIActPrompt(systemData: any, riskSummary: string): string {
  return `Generate compliance documentation for an AI system aligned with the UK AI Regulatory Framework.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Risk Level: ${systemData.risk_level || 'Unknown'}
- Overall Assessment: ${systemData.overall_assessment || 'Unknown'}

Risk Assessments (Approved):
${riskSummary || 'No approved risk assessments'}

Generate comprehensive documentation that addresses all 5 UK AI principles:
1. Safety, Security & Robustness
2. Transparency & Explainability
3. Fairness
4. Accountability & Governance
5. Contestability & Redress

Format the document professionally with clear sections. Use markdown formatting.`;
}

function buildMASPrompt(systemData: any, riskSummary: string): string {
  return `Generate compliance documentation for an AI system aligned with MAS (Monetary Authority of Singapore) AI Risk Management Guidelines.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Overall Risk Level: ${systemData.overall_risk_level || 'Unknown'}
- Overall Compliance Status: ${systemData.overall_compliance_status || 'Unknown'}

Risk Assessments (Approved):
${riskSummary || 'No approved risk assessments'}

Generate comprehensive documentation covering all 12 MAS pillars:
1. Governance & Oversight
2. AI System Identification, Inventory & Risk Classification
3. Data Management
4. Transparency & Explainability
5. Fairness
6. Human Oversight
7. Third-Party / Vendor Management
8. Algorithm & Feature Selection
9. Evaluation & Testing
10. Technology & Cybersecurity
11. Monitoring & Change Management
12. Capability & Capacity

Format the document professionally with clear sections. Use markdown formatting.`;
}

function buildModelCardPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate an AI System Card (Model Card) for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Regulation: ${regulationType}

Risk Assessments:
${riskSummary || 'No approved risk assessments'}

Generate a comprehensive Model Card that includes:
1. Model Details (name, version, type, framework)
2. Intended Use and Limitations
3. Training Data (sources, characteristics, preprocessing)
4. Performance Metrics
5. Evaluation Data
6. Ethical Considerations
7. Risk Assessment Summary
8. Compliance Status
9. Maintenance and Updates

Use markdown formatting.`;
}

function buildTechnicalDocPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate Technical Documentation for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Risk Tier/Level: ${systemData.risk_tier || systemData.risk_level || 'Unknown'}

Risk Assessments:
${riskSummary || 'No approved risk assessments'}

Generate comprehensive technical documentation that includes:
1. System Architecture and Design
2. Technical Specifications
3. Data Specifications and Governance
4. Training Methodology
5. Performance Metrics and Evaluation
6. Risk Management Measures
7. Human Oversight Mechanisms
8. Accuracy, Robustness, and Cybersecurity
9. Monitoring and Logging Capabilities
10. Change Management Procedures

Use markdown formatting.`;
}

function buildDPIAPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate a Data Protection Impact Assessment (DPIA) for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Regulation: ${regulationType}

Risk Assessments:
${riskSummary || 'No approved risk assessments'}

Generate a comprehensive DPIA that includes:
1. System Description and Purpose
2. Data Processing Activities
3. Necessity and Proportionality Assessment
4. Risk Identification and Assessment
5. Data Subject Rights and Safeguards
6. Data Minimization Measures
7. Security Measures
8. Data Retention and Deletion
9. Third-Party Data Sharing
10. Compliance with GDPR/Data Protection Regulations

Use markdown formatting.`;
}

function buildRiskReportPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate a comprehensive Risk Assessment Report for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Regulation: ${regulationType}
- Risk Tier/Level: ${systemData.risk_tier || systemData.risk_level || 'Unknown'}

Risk Assessments (Detailed):
${riskSummary || 'No approved risk assessments'}

Generate a comprehensive Risk Assessment Report that includes:
1. Executive Summary
2. Risk Identification (by category)
3. Risk Analysis and Scoring
4. Risk Evaluation and Prioritization
5. Existing Controls and Mitigations
6. Residual Risk Assessment
7. Risk Treatment Recommendations
8. Monitoring and Review Procedures
9. Risk Register
10. Appendices (evidence, test results, approvals)

Use markdown formatting with clear tables and sections.`;
}

function buildAlgorithmImpactPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate an Algorithm Impact Assessment for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Regulation: ${regulationType}

Risk Assessments:
${riskSummary || 'No approved risk assessments'}

Generate a comprehensive Algorithm Impact Assessment that includes:
1. Algorithm Description and Purpose
2. Decision-Making Process
3. Impact on Individuals and Society
4. Fairness and Bias Analysis
5. Transparency and Explainability
6. Accuracy and Performance
7. Human Oversight Mechanisms
8. Mitigation Measures
9. Monitoring and Evaluation
10. Recommendations

Use markdown formatting.`;
}

function buildAuditTrailPrompt(regulationType: RegulationType, systemData: any, riskSummary: string): string {
  return `Generate an Audit Trail / Records document for this AI system.

System Information:
- Name: ${systemData.system_name || 'Unspecified'}
- Regulation: ${regulationType}

Risk Assessments:
${riskSummary || 'No approved risk assessments'}

Generate a comprehensive Audit Trail document that includes:
1. System Change History
2. Risk Assessment History (with versions and dates)
3. Compliance Check History
4. Documentation Versions
5. Approval and Sign-off Records
6. Incident Log (if applicable)
7. Monitoring Events
8. Training and Update Records
9. Access and Modification Logs
10. Compliance Evidence Trail

Format as a chronological log with clear timestamps. Use markdown formatting with tables.`;
}

/**
 * PUT /api/ai-systems/[id]/policies/[mappingId] - Update a policy mapping
 */
export async function updateSystemPolicyMapping(req: Request, res: Response) {
  try {

    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}



    const { mappingId } = req.params;
    const body = req.body;

    // Update mapping
    const { data: mapping, error } = await supabase
      .from("system_policy_mappings")
      .update({
        compliance_status: body.compliance_status,
        notes: body.notes,
        assessed_by: userId,
        assessed_at: new Date().toISOString(),
      })
      .eq("id", mappingId)
      .select()
      .single();

    if (error) {
      console.error("Error updating mapping:", error);
      return res.status(500).json({ error: "Failed to update policy mapping" });
    }

    if (!mapping) {
      return res.status(404).json({ error: "Mapping not found" });
    }

    return res.json(mapping);
  } catch (err: any) {
    console.error("Error in PUT /api/ai-systems/[id]/policies/[mappingId]:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

/**
 * DELETE /api/ai-systems/[id]/policies/[mappingId] - Remove a policy mapping
 */
export async function deleteSystemPolicyMapping(req: Request, res: Response) {
  try {

    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}



    const { mappingId } = req.params;

    // Delete mapping
    const { error } = await supabase
      .from("system_policy_mappings")
      .delete()
      .eq("id", mappingId);

    if (error) {
      console.error("Error deleting mapping:", error);
      return res.status(500).json({ error: "Failed to delete policy mapping" });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /api/ai-systems/[id]/policies/[mappingId]:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}