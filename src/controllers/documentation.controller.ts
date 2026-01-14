/**
 * Global Documentation API Controller
 *
 * GET /api/documentation - Returns all documentation across all AI systems with system information
 */

import { Request, Response } from 'express';
import { supabaseAdmin } from '../../src/lib/supabase';

/**
 * GET /api/documentation
 * Returns all documentation across all AI systems with system information
 */
export async function getDocumentation(req: Request, res: Response) {
  try {
    const userId = req.user?.sub;
if (!userId) {
  return res.status(401).json({ message: "Unauthorized" });
}
    const supabase = supabaseAdmin;

    // Filter parameters
    const regulationType = req.query.regulation_type as string;
    const documentType = req.query.document_type as string;
    const systemId = req.query.ai_system_id as string;
    const status = req.query.status as string;

    // Build query
    let query = supabase
      .from("compliance_documentation")
      .select("*")
      .eq("org_id", userId)
      .order("created_at", { ascending: false });

    // Apply filters
    if (regulationType) {
      query = query.eq("regulation_type", regulationType);
    }
    if (documentType) {
      query = query.eq("document_type", documentType);
    }
    if (systemId) {
      query = query.eq("ai_system_id", systemId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data: docs, error } = await query;

    if (error) {
      console.error("Error fetching documentation:", error);
      return res.status(500).json({ error: "Failed to fetch documentation" });
    }

    // Enrich with system names
    const enrichedDocs = await Promise.all(
      (docs || []).map(async (doc) => {
        let systemName = "Unknown System";
        let systemType: string | null = null;

        // Try to get system name from different tables
        const [euCheck, ukCheck, masCheck] = await Promise.all([
          supabase
            .from("eu_ai_act_check_results")
            .select("system_name, id")
            .eq("id", doc.ai_system_id)
            .maybeSingle(),
          supabase
            .from("uk_ai_assessments")
            .select("system_name, id")
            .eq("id", doc.ai_system_id)
            .maybeSingle(),
          supabase
            .from("mas_ai_risk_assessments")
            .select("system_name, id")
            .eq("id", doc.ai_system_id)
            .maybeSingle(),
        ]);

        if (euCheck.data) {
          systemName = euCheck.data.system_name || `EU System ${doc.ai_system_id.substring(0, 8)}`;
          systemType = "EU AI Act";
        } else if (ukCheck.data) {
          systemName = ukCheck.data.system_name || `UK System ${doc.ai_system_id.substring(0, 8)}`;
          systemType = "UK AI Act";
        } else if (masCheck.data) {
          systemName = masCheck.data.system_name || `MAS System ${doc.ai_system_id.substring(0, 8)}`;
          systemType = "MAS";
        }

        return {
          ...doc,
          system_name: systemName,
          system_type: systemType,
        };
      })
    );

    return res.status(200).json({
      documentation: enrichedDocs,
      total: enrichedDocs.length
    });
  } catch (error: any) {
    console.error("GET /api/documentation error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}