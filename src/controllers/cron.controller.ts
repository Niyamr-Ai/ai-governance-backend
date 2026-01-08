/**
 * Cron Jobs API Controller
 *
 * GET /api/cron/periodic-risk-review - Periodic risk review cron job
 * GET /api/cron/regenerate-documentation - Regenerate documentation cron job
 */

import { Request, Response } from 'express';

/**
 * GET /api/cron/periodic-risk-review - Periodic risk review cron job
 */
export async function periodicRiskReview(req: Request, res: Response) {
  try {
    // Verify cron secret (if using Vercel Cron)
    const authHeader = req.headers.authorization;
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { createClient } = await import('../../utils/supabase/server');
    const supabase = await createClient();
    const now = new Date().toISOString();

    // Find all systems with assessments that are due for periodic review
    const { data: assessmentsDue, error: queryError } = await supabase
      .from('automated_risk_assessments')
      .select('id, ai_system_id, next_review_date, review_frequency_months, monitoring_enabled')
      .eq('monitoring_enabled', true)
      .lte('next_review_date', now)
      .is('next_review_date', null, { nullFilter: false });

    if (queryError) {
      console.error('Error querying assessments due for review:', queryError);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (!assessmentsDue || assessmentsDue.length === 0) {
      return res.status(200).json({
        message: 'No assessments due for periodic review',
        count: 0
      });
    }

    console.log(`Found ${assessmentsDue.length} assessment(s) due for periodic review`);

    // Trigger new assessments for each system
    const results = [];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ||
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001');

    for (const assessment of assessmentsDue) {
      try {
        // Call the automated risk assessment API
        const { default: axios } = await import('axios');
        const response = await axios.post(
          `${baseUrl}/api/ai-systems/${assessment.ai_system_id}/automated-risk-assessment`,
          {
            trigger_type: 'periodic_review',
            previous_assessment_id: assessment.id
          },
          {
            headers: {
              'Content-Type': 'application/json',
              // Use internal service account or system token if available
            },
          }
        );

        results.push({
          system_id: assessment.ai_system_id,
          assessment_id: response.data.id,
          status: 'success',
        });
        console.log(`✅ Generated periodic review for system ${assessment.ai_system_id}`);

      } catch (err: any) {
        results.push({
          system_id: assessment.ai_system_id,
          status: 'error',
          error: err.response?.data?.error || err.message || 'Unknown error',
        });
        console.error(`❌ Failed to generate review for system ${assessment.ai_system_id}:`, err.message);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return res.status(200).json({
      message: `Processed ${assessmentsDue.length} assessment(s) due for review`,
      total: assessmentsDue.length,
      success: successCount,
      errors: errorCount,
      results,
    });

  } catch (err: any) {
    console.error('Periodic risk review cron job error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

/**
 * GET/POST /api/cron/regenerate-documentation - Regenerate outdated documentation
 */
export async function regenerateDocumentation(req: Request, res: Response) {
  try {
    // Verify cron request
    const cronSecret = req.headers['x-cron-secret'] as string;
    const expectedSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require it
    if (expectedSecret && cronSecret !== expectedSecret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { createClient } = await import('../../utils/supabase/server');
    const supabase = await createClient();

    // Find all outdated documentation
    const { data: outdatedDocs, error: fetchError } = await supabase
      .from("compliance_documentation")
      .select("ai_system_id, regulation_type")
      .eq("status", "outdated")
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching outdated documentation:", fetchError);
      return res.status(500).json({
        error: "Failed to fetch outdated documentation",
        details: fetchError.message
      });
    }

    if (!outdatedDocs || outdatedDocs.length === 0) {
      return res.status(200).json({
        message: "No outdated documentation found",
        regenerated: 0,
      });
    }

    // Group by system ID and regulation type to avoid duplicates
    const uniqueSystems = new Map<string, string[]>();
    for (const doc of outdatedDocs) {
      const key = doc.ai_system_id;
      if (!uniqueSystems.has(key)) {
        uniqueSystems.set(key, []);
      }
      const types = uniqueSystems.get(key)!;
      if (!types.includes(doc.regulation_type)) {
        types.push(doc.regulation_type);
      }
    }

    // Regenerate documentation for each unique system/regulation combination
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const [systemId, regulationTypes] of uniqueSystems.entries()) {
      try {
        const { autoGenerateDocumentationIfNeeded } = await import('../../services/documentation/documentation-auto-generate');
        await autoGenerateDocumentationIfNeeded(systemId, regulationTypes as any);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`${systemId} (${regulationTypes.join(', ')}): ${error.message || error}`);
        console.error(`Failed to regenerate docs for system ${systemId}:`, error);
      }
    }

    return res.status(200).json({
      message: "Documentation regeneration completed",
      total: outdatedDocs.length,
      unique_systems: uniqueSystems.size,
      regenerated: successCount,
      errors: errorCount,
      error_details: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("Cron job error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}
