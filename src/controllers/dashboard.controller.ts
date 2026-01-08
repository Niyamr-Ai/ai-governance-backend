/**
 * Dashboard API Controller
 *
 * POST /api/dashboard/insights - Provides RAG-powered insights for compliance dashboards
 */

import { Request, Response } from 'express';
import { getDashboardInsights, getSystemInsights } from '../../services/dashboard/dashboard-insights';
import type { RegulationType } from '../../services/ai/rag-service';

/**
 * POST /api/dashboard/insights
 * Provides RAG-powered insights for compliance dashboards
 */
export async function getDashboardInsightsHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const { systemsData, regulationType = 'EU' } = body;

    // Validate required parameters
    if (!systemsData || !Array.isArray(systemsData)) {
      return res.status(400).json({ error: "Systems data array is required" });
    }

    // Validate regulation type if provided
    if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
      return res.status(400).json({ error: "Invalid regulation type" });
    }

    // Get insights from RAG service
    const insights = await getDashboardInsights(
      systemsData,
      regulationType as RegulationType
    );

    return res.json(insights);

  } catch (error) {
    console.error("Error getting dashboard insights:", error);
    return res.status(500).json({ error: "Failed to get dashboard insights" });
  }
}

/**
 * POST /api/dashboard/system-insights
 * Provides RAG-powered insights for individual systems
 */
export async function getSystemInsightsHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const { systemData, regulationType = 'EU' } = body;

    // Validate required parameters
    if (!systemData) {
      return res.status(400).json({ error: "System data is required" });
    }

    // Validate regulation type if provided
    if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
      return res.status(400).json({ error: "Invalid regulation type" });
    }

    // Get insights from RAG service
    const insights = await getSystemInsights(
      systemData,
      regulationType as RegulationType
    );

    return res.json(insights);

  } catch (error) {
    console.error("Error getting system insights:", error);
    return res.status(500).json({ error: "Failed to get system insights" });
  }
}