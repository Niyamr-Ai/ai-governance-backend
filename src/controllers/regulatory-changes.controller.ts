/**
 * Regulatory Changes API Controller
 *
 * POST /api/regulatory-changes/action-plan - Generate compliance action plan
 * POST /api/regulatory-changes/effort-estimation - Estimate implementation effort
 * POST /api/regulatory-changes/impact-analysis - Analyze regulatory change impact
 */

import { Request, Response } from 'express';

/**
 * POST /api/regulatory-changes/action-plan - Generate compliance action plan
 */
export async function generateActionPlan(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { impact_analysis, regulatory_change, organization_capacity } = body;

    // Validate required fields
    if (!impact_analysis || !impact_analysis.system_id) {
      return res.status(400).json({ error: "Impact analysis is required" });
    }

    if (!regulatory_change || !regulatory_change.title) {
      return res.status(400).json({ error: "Regulatory change information is required" });
    }

    console.log(`[API] Generating compliance action plan for system ${impact_analysis.system_id}`);

    // Generate compliance action plan using RAG
    const { generateComplianceActionPlan } = await import('../../services/compliance/regulatory-change-impact-analysis');
    const actionPlan = await generateComplianceActionPlan(
      impact_analysis,
      regulatory_change,
      organization_capacity,
      userId
    );

    // Calculate action plan metrics
    const actionMetrics = {
      total_action_items: actionPlan.action_items.length,
      by_priority: {
        immediate: actionPlan.action_items.filter(item => item.priority === 'immediate').length,
        high: actionPlan.action_items.filter(item => item.priority === 'high').length,
        medium: actionPlan.action_items.filter(item => item.priority === 'medium').length,
        low: actionPlan.action_items.filter(item => item.priority === 'low').length
      },
      by_category: {
        documentation: actionPlan.action_items.filter(item => item.category === 'documentation').length,
        technical_implementation: actionPlan.action_items.filter(item => item.category === 'technical_implementation').length,
        process_change: actionPlan.action_items.filter(item => item.category === 'process_change').length,
        training: actionPlan.action_items.filter(item => item.category === 'training').length,
        assessment: actionPlan.action_items.filter(item => item.category === 'assessment').length
      },
      by_effort: {
        low: actionPlan.action_items.filter(item => item.estimated_effort === 'low').length,
        medium: actionPlan.action_items.filter(item => item.estimated_effort === 'medium').length,
        high: actionPlan.action_items.filter(item => item.estimated_effort === 'high').length
      },
      total_milestones: actionPlan.milestones.length,
      total_risks: actionPlan.risk_mitigation.length
    };

    // Estimate overall timeline
    const immediateActions = actionPlan.action_items.filter(item => item.priority === 'immediate').length;
    const highPriorityActions = actionPlan.action_items.filter(item => item.priority === 'high').length;
    const totalHighPriorityActions = immediateActions + highPriorityActions;

    let estimatedTimelineWeeks = 4; // Base timeline
    if (totalHighPriorityActions > 10) estimatedTimelineWeeks = 16;
    else if (totalHighPriorityActions > 5) estimatedTimelineWeeks = 12;
    else if (totalHighPriorityActions > 2) estimatedTimelineWeeks = 8;

    return res.status(200).json({
      action_plan: actionPlan,
      action_metrics: actionMetrics,
      timeline_estimate: {
        estimated_weeks: estimatedTimelineWeeks,
        critical_path_items: actionPlan.action_items
          .filter(item => item.priority === 'immediate' || item.priority === 'high')
          .slice(0, 5)
          .map(item => item.title),
        key_dependencies: actionPlan.action_items
          .filter(item => item.dependencies && item.dependencies.length > 0)
          .map(item => ({
            action: item.title,
            dependencies: item.dependencies
          }))
      },
      system: {
        id: impact_analysis.system_id,
        name: impact_analysis.system_name,
        regulation_type: impact_analysis.regulation_type
      },
      regulatory_change: {
        title: regulatory_change.title,
        effective_date: regulatory_change.effective_date,
        compliance_deadline: regulatory_change.compliance_deadline
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error generating compliance action plan:", error);
    return res.status(500).json({
      error: "Failed to generate compliance action plan",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/regulatory-changes/effort-estimation - Estimate implementation effort
 */
export async function estimateEffort(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { required_changes, organization_capacity } = body;

    // Validate required fields
    if (!required_changes || !Array.isArray(required_changes) || required_changes.length === 0) {
      return res.status(400).json({ error: "Required changes array is required" });
    }

    if (!organization_capacity || typeof organization_capacity.team_size !== 'number') {
      return res.status(400).json({ error: "Organization capacity with team_size is required" });
    }

    console.log(`[API] Estimating compliance effort for ${required_changes.length} systems`);

    // Validate required_changes structure
    const validatedChanges = required_changes.map((change, index) => {
      if (!change.system_id || !change.system_name) {
        throw new Error(`Invalid change at index ${index}: system_id and system_name are required`);
      }

      return {
        system_id: change.system_id,
        system_name: change.system_name,
        impact_level: change.impact_level || 'medium',
        required_actions: Array.isArray(change.required_actions) ? change.required_actions : [],
        estimated_effort: change.estimated_effort || 'medium'
      };
    });

    // Validate organization_capacity structure
    const validatedCapacity = {
      team_size: Math.max(1, organization_capacity.team_size),
      available_budget: organization_capacity.available_budget || 'medium',
      external_support_available: Boolean(organization_capacity.external_support_available),
      timeline_constraints: organization_capacity.timeline_constraints || 'No specific constraints'
    };

    // Estimate compliance effort using RAG
    const { estimateComplianceEffort } = await import('../../services/compliance/regulatory-change-impact-analysis');
    const effortEstimation = await estimateComplianceEffort(
      validatedChanges,
      validatedCapacity,
      userId
    );

    // Calculate additional metrics
    const systemsByImpact = {
      critical: validatedChanges.filter(c => c.impact_level === 'critical').length,
      high: validatedChanges.filter(c => c.impact_level === 'high').length,
      medium: validatedChanges.filter(c => c.impact_level === 'medium').length,
      low: validatedChanges.filter(c => c.impact_level === 'low').length,
      minimal: validatedChanges.filter(c => c.impact_level === 'minimal').length
    };

    const systemsByEffort = {
      high: validatedChanges.filter(c => c.estimated_effort === 'high').length,
      medium: validatedChanges.filter(c => c.estimated_effort === 'medium').length,
      low: validatedChanges.filter(c => c.estimated_effort === 'low').length
    };

    // Identify bottlenecks and risks
    const bottlenecks = [];
    if (validatedCapacity.team_size < validatedChanges.length / 3) {
      bottlenecks.push('Limited team capacity relative to number of systems');
    }
    if (validatedCapacity.available_budget === 'low' && effortEstimation.total_effort_estimate === 'very_high') {
      bottlenecks.push('Budget constraints may limit implementation options');
    }
    if (systemsByImpact.critical > 0 && !validatedCapacity.external_support_available) {
      bottlenecks.push('Critical systems may require external expertise');
    }

    // Generate recommendations based on analysis
    const recommendations = [];
    if (effortEstimation.total_effort_estimate === 'very_high') {
      recommendations.push('Consider phased implementation approach to manage resource constraints');
      recommendations.push('Prioritize critical and high-impact systems for immediate attention');
    }
    if (systemsByImpact.critical > 2) {
      recommendations.push('Establish dedicated task force for critical system compliance');
    }
    if (validatedCapacity.available_budget === 'low') {
      recommendations.push('Explore cost-effective compliance solutions and automation opportunities');
    }

    return res.status(200).json({
      effort_estimation: effortEstimation,
      input_analysis: {
        total_systems: validatedChanges.length,
        systems_by_impact: systemsByImpact,
        systems_by_effort: systemsByEffort,
        organization_capacity: validatedCapacity
      },
      risk_analysis: {
        bottlenecks: bottlenecks,
        risk_level: effortEstimation.total_effort_estimate === 'very_high' ? 'high' :
                   effortEstimation.total_effort_estimate === 'high' ? 'medium' : 'low',
        mitigation_strategies: effortEstimation.implementation_strategy.risk_factors
      },
      recommendations: recommendations,
      next_steps: [
        'Review and validate effort estimation with stakeholders',
        'Secure necessary resources and budget approval',
        'Establish project governance and communication channels',
        'Begin with highest priority systems and immediate actions',
        'Set up monitoring and progress tracking mechanisms'
      ],
      estimated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error estimating compliance effort:", error);
    return res.status(500).json({
      error: "Failed to estimate compliance effort",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/regulatory-changes/impact-analysis - Analyze regulatory change impact
 */
export async function analyzeImpact(req: Request, res: Response) {
  try {
    const userId = req.user!.sub;
    const body = req.body;
    const { regulatory_change, system_ids } = body;

    // Validate required fields
    if (!regulatory_change || !regulatory_change.title || !regulatory_change.regulation_type) {
      return res.status(400).json({ error: "Missing required regulatory change information" });
    }

    if (!system_ids || !Array.isArray(system_ids) || system_ids.length === 0) {
      return res.status(400).json({ error: "At least one system ID is required for impact analysis" });
    }

    const { supabaseAdmin } = await import('../../src/lib/supabase');
    const supabase = supabaseAdmin;

    // Fetch system information for all requested systems
    const systemAnalyses = [];
    const errors = [];

    for (const systemId of system_ids) {
      try {
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

        // Determine primary system data
        let systemData: any = null;
        let systemRegulationType = regulatory_change.regulation_type;

        if (regulatory_change.regulation_type === 'EU' && euData) {
          systemData = euData;
        } else if (regulatory_change.regulation_type === 'UK' && ukData) {
          systemData = ukData;
        } else if (regulatory_change.regulation_type === 'MAS' && masData) {
          systemData = masData;
        } else if (registryData) {
          systemData = registryData;
        } else {
          // Try any available data
          systemData = euData || ukData || masData || registryData;
        }

        if (!systemData) {
          errors.push({
            system_id: systemId,
            error: "System not found or not applicable to this regulation type"
          });
          continue;
        }

        // Prepare system data for analysis
        const analysisSystemData = {
          id: systemId,
          name: systemData.system_name || systemData.name || `System ${systemId}`,
          description: systemData.system_description || systemData.description || '',
          risk_tier: systemData.risk_tier || systemData.risk_classification || 'medium',
          lifecycle_stage: systemData.lifecycle_stage || 'Draft',
          compliance_status: systemData.compliance_status || systemData.overall_assessment || systemData.overall_compliance_status || 'Unknown',
          regulation_type: systemRegulationType,
          ...systemData
        };

        console.log(`[API] Analyzing regulatory impact for system ${systemId}`);

        // Analyze regulatory impact using RAG
        const { analyzeRegulatoryImpact } = await import('../../services/compliance/regulatory-change-impact-analysis');
        const impactAnalysis = await analyzeRegulatoryImpact(
          regulatory_change,
          analysisSystemData,
          userId
        );

        systemAnalyses.push({
          system_id: systemId,
          system_name: analysisSystemData.name,
          impact_analysis: impactAnalysis
        });

      } catch (error) {
        console.error(`Error analyzing system ${systemId}:`, error);
        errors.push({
          system_id: systemId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // Calculate overall portfolio impact
    const impactLevels = systemAnalyses.map(s => s.impact_analysis.overall_impact_level);
    const impactDistribution = {
      minimal: impactLevels.filter(level => level === 'minimal').length,
      low: impactLevels.filter(level => level === 'low').length,
      medium: impactLevels.filter(level => level === 'medium').length,
      high: impactLevels.filter(level => level === 'high').length,
      critical: impactLevels.filter(level => level === 'critical').length
    };

    // Determine overall portfolio impact
    let overallPortfolioImpact: 'minimal' | 'low' | 'medium' | 'high' | 'critical' = 'minimal';
    if (impactDistribution.critical > 0) overallPortfolioImpact = 'critical';
    else if (impactDistribution.high > 0) overallPortfolioImpact = 'high';
    else if (impactDistribution.medium > 0) overallPortfolioImpact = 'medium';
    else if (impactDistribution.low > 0) overallPortfolioImpact = 'low';

    // Identify priority systems
    const prioritySystems = systemAnalyses
      .filter(s => s.impact_analysis.overall_impact_level === 'high' || s.impact_analysis.overall_impact_level === 'critical')
      .map(s => ({
        system_id: s.system_id,
        system_name: s.system_name,
        impact_level: s.impact_analysis.overall_impact_level as 'high' | 'critical',
        key_concerns: s.impact_analysis.affected_areas.slice(0, 3).map(area => area.area),
        estimated_effort: s.impact_analysis.affected_areas.length > 0 ? s.impact_analysis.affected_areas[0].estimated_effort : 'medium' as const
      }));

    return res.status(200).json({
      regulatory_change: {
        title: regulatory_change.title,
        regulation_type: regulatory_change.regulation_type,
        severity: regulatory_change.severity,
        effective_date: regulatory_change.effective_date
      },
      portfolio_impact: {
        total_systems: system_ids.length,
        systems_analyzed: systemAnalyses.length,
        systems_with_errors: errors.length,
        overall_portfolio_impact: overallPortfolioImpact,
        impact_distribution: impactDistribution,
        priority_systems: prioritySystems
      },
      system_analyses: systemAnalyses,
      errors: errors,
      analyzed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error analyzing regulatory impact:", error);
    return res.status(500).json({
      error: "Failed to analyze regulatory impact",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
