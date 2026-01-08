/**
 * Risk Assessment API Controller
 *
 * POST /api/risk-assessment/field-guidance - Provides targeted guidance for specific form fields
 */

import { Request, Response } from 'express';
import { getFieldGuidance, getRiskAssessmentGuidance, type RiskCategory } from '../../services/risk-assessment/guidance';
import type { RegulationType } from '../../services/ai/rag-service';

/**
 * POST /api/risk-assessment/field-guidance - Provides targeted guidance for specific form fields
 */
export async function getFieldGuidanceHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const { field, category, riskLevel } = body;

    // Validate required parameters
    if (!field || !category) {
      return res.status(400).json({ error: "Field and category are required" });
    }

    // Validate category
    const validCategories: RiskCategory[] = ['bias', 'robustness', 'privacy', 'explainability'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // Validate risk level if provided
    if (riskLevel && !['low', 'medium', 'high'].includes(riskLevel)) {
      return res.status(400).json({ error: "Invalid risk level" });
    }

    // Get field guidance
    const guidance = await getFieldGuidance(field, category, riskLevel);

    return res.json({ guidance });

  } catch (error) {
    console.error("Error getting field guidance:", error);
    return res.status(500).json({ error: "Failed to get field guidance" });
  }
}

/**
 * POST /api/risk-assessment/guidance - Provides RAG-powered guidance for risk assessment forms
 */
export async function getGuidanceHandler(req: Request, res: Response) {
  try {
    const body = req.body;
    const { category, riskLevel, regulationType, systemContext } = body;

    // Validate required parameters
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Validate category
    const validCategories: RiskCategory[] = ['bias', 'robustness', 'privacy', 'explainability'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    // Validate risk level if provided
    if (riskLevel && !['low', 'medium', 'high'].includes(riskLevel)) {
      return res.status(400).json({ error: "Invalid risk level" });
    }

    // Validate regulation type if provided
    if (regulationType && !['EU', 'UK', 'MAS'].includes(regulationType)) {
      return res.status(400).json({ error: "Invalid regulation type" });
    }

    // Get guidance from RAG service
    const guidance = await getRiskAssessmentGuidance(
      category,
      riskLevel,
      regulationType as RegulationType,
      systemContext
    );

    return res.json(guidance);

  } catch (error) {
    console.error("Error getting risk assessment guidance:", error);
    return res.status(500).json({ error: "Failed to get guidance" });
  }
}
