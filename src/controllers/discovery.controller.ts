/**
 * Discovery API Controller
 *
 * POST /api/discovery/smart-assessment - Generate smart assessment for discovered AI assets
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../../src/lib/supabase';
import { generateShadowAIAssessment, suggestSystemLinks, prioritizeDiscoveredSystems } from '../../services/compliance/smart-shadow-ai-discovery';
import type { DiscoveredAIAsset } from '../../types/discovery';

/**
 * POST /api/discovery/smart-assessment - Generate smart assessment for discovered AI assets
 */
export async function createSmartAssessment(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const body = req.body;
    const { asset_id, organization_context } = body;

    // Validate required fields
    if (!asset_id) {
      return res.status(400).json({ error: "Missing required field: asset_id" });
    }

    const supabase = supabaseAdmin;

    // Fetch the discovered asset
    const { data: asset, error: assetError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    console.log(`[API] Generating smart assessment for asset ${asset_id}`);

    // Generate smart assessment using RAG
    const assessment = await generateShadowAIAssessment(
      asset as DiscoveredAIAsset,
      userId,
      organization_context
    );

    return res.json({
      assessment,
      asset: {
        id: asset.id,
        name: asset.detected_name,
        vendor: asset.detected_vendor,
        environment: asset.environment
      },
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error("[API] Error generating smart assessment:", error);
    return res.status(500).json({
      error: "Failed to generate assessment",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * GET /api/discovery - List all discovered AI assets
 */
export async function getDiscovery(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const supabase = supabaseAdmin;

    // Build query
    let query = supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .order("discovered_at", { ascending: false });

    // Apply filters
    const shadowStatus = req.query.shadow_status as string;
    if (shadowStatus) {
      query = query.eq("shadow_status", shadowStatus);
    }

    const sourceType = req.query.source_type as string;
    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const environment = req.query.environment as string;
    if (environment) {
      query = query.eq("environment", environment);
    }

    const { data: assets, error } = await query;

    if (error) {
      console.error("Error fetching discovered assets:", error);
      return res.status(500).json({
        error: "Failed to fetch discovered assets",
        details: error.message
      });
    }

    // Calculate stats
    const totalAssets = assets?.length || 0;
    const potentialShadow = assets?.filter(a => a.shadow_status === 'potential' && !a.linked_system_id).length || 0;
    const confirmedShadow = assets?.filter(a => a.shadow_status === 'confirmed').length || 0;
    const linkedAssets = assets?.filter(a => a.linked_system_id).length || 0;

    return res.status(200).json({
      assets: assets,
      stats: {
        total: totalAssets,
        potential_shadow: potentialShadow,
        confirmed_shadow: confirmedShadow,
        linked: linkedAssets,
      }
    });
  } catch (error: any) {
    console.error("GET /api/discovery error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/discovery - Create a new discovered asset
 */
export async function postDiscovery(req: Request, res: Response) {
  try {
          const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const body = req.body;

    // Validate required fields
    if (!body.source_type || !body.detected_name) {
      return res.status(400).json({
        error: "Missing required fields: source_type, detected_name"
      });
    }

    // Validate source_type
    const validSourceTypes = ['repo_scan', 'api_scan', 'vendor_detection', 'manual_hint'];
    if (!validSourceTypes.includes(body.source_type)) {
      return res.status(400).json({
        error: `Invalid source_type. Must be one of: ${validSourceTypes.join(', ')}`
      });
    }

    const supabase = supabaseAdmin;

    // Prepare asset data
    const assetData = {
      source_type: body.source_type,
      detected_name: body.detected_name,
      detected_description: body.detected_description || null,
      detected_vendor: body.detected_vendor || null,
      detected_endpoint_or_repo: body.detected_endpoint_or_repo || null,
      confidence_score: body.confidence_score || 'medium',
      environment: body.environment || null,
      shadow_status: 'potential', // Always start as potential
      created_by: userId,
      // TEMPORARY: org_id currently maps 1:1 to user_id.
      // This will change when true organizations are introduced.
      org_id: userId,
      metadata: body.metadata || {},
    };

    // Insert discovered asset
    const { data: asset, error: insertError } = await supabase
      .from("discovered_ai_assets")
      .insert([assetData])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating discovered asset:", insertError);
      return res.status(500).json({
        error: "Failed to create discovered asset",
        details: insertError.message
      });
    }

    // Create discovery event
    const { error: eventError } = await supabase
      .from("discovery_events")
      .insert([{
        discovered_asset_id: asset.id,
        event_type: 'detected',
        performed_by: userId,
        notes: `Asset discovered via ${body.source_type}`,
      }]);

    if (eventError) {
      console.error("Error creating discovery event:", eventError);
      // Don't fail the request if event creation fails
    }

    return res.status(201).json(asset);
  } catch (error: any) {
    console.error("POST /api/discovery error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}

/**
 * POST /api/discovery/link-suggestions
 * Generate system linking suggestions for discovered assets
 */
export async function getLinkSuggestions(req: Request, res: Response) {
  try {
        const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const body = req.body;
    const { asset_id, max_suggestions = 5 } = body;

    // Validate required fields
    if (!asset_id) {
      return res.status(400).json({ error: "Missing required field: asset_id" });
    }

    const supabase = supabaseAdmin;

    // Fetch the discovered asset
    const { data: asset, error: assetError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    console.log(`[API] Generating system link suggestions for asset ${asset_id}`);

    // Generate link suggestions using RAG
    const suggestions = await suggestSystemLinks(
      asset as DiscoveredAIAsset,
      userId,
      Math.min(Math.max(1, max_suggestions), 10) // Limit between 1-10
    );

    return res.json({
      suggestions,
      asset: {
        id: asset.id,
        name: asset.detected_name,
        vendor: asset.detected_vendor
      },
      generated_at: new Date().toISOString(),
      suggestion_count: suggestions.length
    });

  } catch (error) {
    console.error("[API] Error generating link suggestions:", error);
    return res.status(500).json({
      error: "Failed to generate link suggestions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/discovery/[id]/mark-shadow
 * Mark a discovered asset as confirmed Shadow AI
 */
export async function markAsShadowAI(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const { id: assetId } = req.params;
    const body = req.body;
    const supabase = supabaseAdmin;

    // Check permissions (admin or creator)
    const { data: existingAsset, error: fetchError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .eq("id", assetId)
      .single();

    if (fetchError || !existingAsset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    const { data: user } = await supabase.auth.getUser();
    const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
                    user?.user?.user_metadata?.role === 'Admin';
    const isCreator = existingAsset.created_by === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: "Forbidden: Only creator or admin can confirm Shadow AI"
      });
    }

    // Update asset: mark as confirmed shadow AI
    const { data: updatedAsset, error: updateError } = await supabase
      .from("discovered_ai_assets")
      .update({
        shadow_status: 'confirmed',
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .select()
      .single();

    if (updateError) {
      console.error("Error marking shadow AI:", updateError);
      return res.status(500).json({
        error: "Failed to mark as Shadow AI",
        details: updateError.message
      });
    }

    // Create discovery event
    const { error: eventError } = await supabase
      .from("discovery_events")
      .insert([{
        discovered_asset_id: assetId,
        event_type: 'marked_shadow',
        performed_by: userId,
        notes: body.notes || 'Confirmed as Shadow AI',
      }]);

    if (eventError) {
      console.error("Error creating discovery event:", eventError);
      // Don't fail the request
    }

    return res.status(200).json({
      message: "Asset marked as confirmed Shadow AI",
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("POST /api/discovery/[id]/mark-shadow error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/discovery/[id]/resolve
 * Mark a discovered asset as resolved (false positive or no longer relevant)
 */
export async function resolveDiscoveredAsset(req: Request, res: Response) {
  try {
      const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const { id: assetId } = req.params;
    const body = req.body;
    const supabase = supabaseAdmin;

    // Check permissions (admin or creator)
    const { data: existingAsset, error: fetchError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .eq("id", assetId)
      .single();

    if (fetchError || !existingAsset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    const { data: user } = await supabase.auth.getUser();
    const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
                    user?.user?.user_metadata?.role === 'Admin';
    const isCreator = existingAsset.created_by === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: "Forbidden: Only creator or admin can resolve assets"
      });
    }

    // Update asset: mark as resolved
    const { data: updatedAsset, error: updateError } = await supabase
      .from("discovered_ai_assets")
      .update({
        shadow_status: 'resolved',
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .select()
      .single();

    if (updateError) {
      console.error("Error resolving asset:", updateError);
      return res.status(500).json({
        error: "Failed to resolve asset",
        details: updateError.message
      });
    }

    // Create discovery event
    const { error: eventError } = await supabase
      .from("discovery_events")
      .insert([{
        discovered_asset_id: assetId,
        event_type: 'resolved',
        performed_by: userId,
        notes: body.notes || 'Resolved as false positive or no longer relevant',
      }]);

    if (eventError) {
      console.error("Error creating discovery event:", eventError);
      // Don't fail the request
    }

    return res.status(200).json({
      message: "Asset resolved successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("POST /api/discovery/[id]/resolve error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/discovery/[id]/create-system
 * Create a new AI system from a discovered asset
 * Then links the asset to the newly created system
 */
export async function createSystemFromAsset(req: Request, res: Response) {
  try {
      const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const { id: assetId } = req.params;
    const body = req.body;
    const supabase = supabaseAdmin;

    // Validate required fields
    if (!body.system_name) {
      return res.status(400).json({ error: "Missing required field: system_name" });
    }

    // Fetch the discovered asset
    const { data: asset, error: fetchError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("id", assetId)
      .single();

    if (fetchError || !asset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    // Create a new EU AI Act assessment entry (basic structure)
    // This will be the registered system
    const systemData = {
      system_name: body.system_name,
      description: body.description || asset.detected_description || null,
      owner: body.owner || null,
      // Use detected vendor info if available
      // Add other fields as needed
    };

    // Insert into eu_ai_act_check_results as a basic entry
    // Note: This creates a minimal entry that can be filled in later
    const { data: newSystem, error: createError } = await supabase
      .from("eu_ai_act_check_results")
      .insert([{
        ...systemData,
        user_id: userId,
        // Set default values for required fields
        risk_tier: 'unknown',
        compliance_status: 'pending',
        prohibited_practices_detected: false,
        high_risk_all_fulfilled: false,
        high_risk_missing: [],
        transparency_required: false,
        transparency_missing: [],
        monitoring_required: false,
        post_market_monitoring: false,
        incident_reporting: false,
        fria_completed: false,
        summary: `System created from discovered asset: ${asset.detected_name}`,
        reference: assetId,
      }])
      .select()
      .single();

    if (createError) {
      console.error("Error creating system:", createError);
      return res.status(500).json({
        error: "Failed to create AI system",
        details: createError.message
      });
    }

    // Link the asset to the newly created system
    const { data: updatedAsset, error: linkError } = await supabase
      .from("discovered_ai_assets")
      .update({
        linked_system_id: newSystem.id,
        shadow_status: 'resolved',
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .select()
      .single();

    if (linkError) {
      console.error("Error linking asset to new system:", linkError);
      // Don't fail - system was created successfully
    }

    // Create discovery event
    const { error: eventError } = await supabase
      .from("discovery_events")
      .insert([{
        discovered_asset_id: assetId,
        event_type: 'linked',
        performed_by: userId,
        notes: body.notes || `Created new AI system from discovered asset: ${newSystem.id}`,
      }]);

    if (eventError) {
      console.error("Error creating discovery event:", eventError);
      // Don't fail the request
    }

    return res.status(201).json({
      message: "AI system created and asset linked successfully",
      system: newSystem,
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("POST /api/discovery/[id]/create-system error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/discovery/prioritization
 * Prioritize discovered AI systems based on risk and business impact
 */
export async function getPrioritization(req: Request, res: Response) {
  try {
      const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const body = req.body;
    const { asset_ids, shadow_status_filter } = body;

    const supabase = supabaseAdmin;

    let query = supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .order("discovered_at", { ascending: false });

    // Filter by specific asset IDs if provided
    if (asset_ids && Array.isArray(asset_ids) && asset_ids.length > 0) {
      query = query.in("id", asset_ids);
    }

    // Filter by shadow status if provided
    if (shadow_status_filter && ['potential', 'confirmed', 'resolved'].includes(shadow_status_filter)) {
      query = query.eq("shadow_status", shadow_status_filter);
    }

    const { data: assets, error: assetsError } = await query;

    if (assetsError) {
      console.error("Error fetching discovered assets:", assetsError);
      return res.status(500).json({
        error: "Failed to fetch discovered assets",
        details: assetsError.message
      });
    }

    if (!assets || assets.length === 0) {
      return res.json({
        prioritizations: [],
        message: "No discovered assets found to prioritize",
        generated_at: new Date().toISOString()
      });
    }

    console.log(`[API] Prioritizing ${assets.length} discovered systems`);

    // Generate prioritization using RAG
    const prioritizations = await prioritizeDiscoveredSystems(
      assets as DiscoveredAIAsset[],
      userId
    );

    // Sort by priority score (highest first)
    const sortedPrioritizations = prioritizations.sort((a, b) => b.priority_score - a.priority_score);

    return res.json({
      prioritizations: sortedPrioritizations,
      total_assets: assets.length,
      generated_at: new Date().toISOString(),
      priority_distribution: {
        critical: sortedPrioritizations.filter(p => p.priority_level === 'critical').length,
        high: sortedPrioritizations.filter(p => p.priority_level === 'high').length,
        medium: sortedPrioritizations.filter(p => p.priority_level === 'medium').length,
        low: sortedPrioritizations.filter(p => p.priority_level === 'low').length,
      }
    });

  } catch (error) {
    console.error("[API] Error generating prioritization:", error);
    return res.status(500).json({
      error: "Failed to generate prioritization",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * POST /api/discovery/[id]/link
 * Link a discovered asset to an existing AI system
 */
export async function linkDiscoveredAsset(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const { id: assetId } = req.params;
    const body = req.body;
    const supabase = supabaseAdmin;

    // Validate required fields
    if (!body.linked_system_id) {
      return res.status(400).json({ error: "Missing required field: linked_system_id" });
    }

    // Check permissions (admin or creator)
    const { data: existingAsset, error: fetchError } = await supabase
      .from("discovered_ai_assets")
      .select("*")
      .eq("org_id", userId)
      .eq("id", assetId)
      .single();

    if (fetchError || !existingAsset) {
      return res.status(404).json({ error: "Discovered asset not found" });
    }

    const { data: user } = await supabase.auth.getUser();
    const isAdmin = user?.user?.user_metadata?.role === 'admin' ||
                    user?.user?.user_metadata?.role === 'Admin';
    const isCreator = existingAsset.created_by === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({
        error: "Forbidden: Only creator or admin can link assets"
      });
    }

    // Verify the linked system exists (check EU, MAS, UK, or registry)
    const systemId = body.linked_system_id;
    let systemExists = false;

    // Check EU AI Act assessments
    const { data: euAssessment } = await supabase
      .from("eu_ai_act_check_results")
      .select("id")
      .eq("id", systemId)
      .maybeSingle();
    if (euAssessment) systemExists = true;

    // Check MAS assessments
    if (!systemExists) {
      const { data: masAssessment } = await supabase
        .from("mas_ai_risk_assessments")
        .select("id")
        .eq("id", systemId)
        .maybeSingle();
      if (masAssessment) systemExists = true;
    }

    // Check UK assessments
    if (!systemExists) {
      const { data: ukAssessment } = await supabase
        .from("uk_ai_assessments")
        .select("id")
        .eq("id", systemId)
        .maybeSingle();
      if (ukAssessment) systemExists = true;
    }

    // Check ai_system_registry
    if (!systemExists) {
      const { data: registrySystem } = await supabase
        .from("ai_system_registry")
        .select("system_id")
        .eq("system_id", systemId)
        .maybeSingle();
      if (registrySystem) systemExists = true;
    }

    if (!systemExists) {
      return res.status(404).json({
        error: "Linked system not found in any assessment table or registry"
      });
    }

    // Update asset: link to system and mark as resolved
    const { data: updatedAsset, error: updateError } = await supabase
      .from("discovered_ai_assets")
      .update({
        linked_system_id: systemId,
        shadow_status: 'resolved',
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .select()
      .single();

    if (updateError) {
      console.error("Error linking asset:", updateError);
      return res.status(500).json({
        error: "Failed to link asset",
        details: updateError.message
      });
    }

    // Create discovery event
    const { error: eventError } = await supabase
      .from("discovery_events")
      .insert([{
        discovered_asset_id: assetId,
        event_type: 'linked',
        performed_by: userId,
        notes: body.notes || `Linked to system ${systemId}`,
      }]);

    if (eventError) {
      console.error("Error creating discovery event:", eventError);
      // Don't fail the request
    }

    return res.status(200).json({
      message: "Asset linked successfully",
      asset: updatedAsset,
    });
  } catch (error: any) {
    console.error("POST /api/discovery/[id]/link error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
