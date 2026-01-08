/**
 * Shadow AI Governance Helpers
 * 
 * Functions to check for Shadow AI and enforce governance rules
 */

import { createClient } from "@/ai-governance-backend/utils/supabase/server";

/**
 * Check if a system has confirmed Shadow AI
 * @param systemId - The AI system ID to check
 * @returns Object with hasShadowAI flag and details
 */
export async function checkShadowAI(systemId: string): Promise<{
  hasShadowAI: boolean;
  confirmedShadowCount: number;
  potentialShadowCount: number;
  shadowAssets: Array<{
    id: string;
    detected_name: string;
    shadow_status: string;
  }>;
}> {
  const supabase = await createClient();

  // Check for confirmed shadow AI linked to this system
  const { data: confirmedShadow } = await supabase
    .from("discovered_ai_assets")
    .select("id, detected_name, shadow_status")
    .eq("linked_system_id", systemId)
    .eq("shadow_status", "confirmed");

  // Check for potential shadow AI (not linked)
  // This would be systems that might be related but aren't linked yet
  // For now, we focus on confirmed shadow AI linked to the system

  const confirmedShadowCount = confirmedShadow?.length || 0;

  return {
    hasShadowAI: confirmedShadowCount > 0,
    confirmedShadowCount,
    potentialShadowCount: 0, // Could be enhanced to check for unlinked assets
    shadowAssets: confirmedShadow || [],
  };
}

/**
 * Check if there are any unlinked discovered assets that could be shadow AI
 * @param systemId - Optional system ID to exclude from check
 * @returns Count of potential shadow AI assets
 */
export async function checkUnlinkedShadowAI(systemId?: string): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("discovered_ai_assets")
    .select("id", { count: "exact", head: true })
    .is("linked_system_id", null)
    .in("shadow_status", ["potential", "confirmed"]);

  const { count } = await query;

  return count || 0;
}

/**
 * Get shadow AI warning message for a system
 * @param systemId - The AI system ID
 * @returns Warning message or null
 */
export async function getShadowAIWarning(systemId: string): Promise<string | null> {
  const shadowCheck = await checkShadowAI(systemId);

  if (shadowCheck.hasShadowAI) {
    return `Unregistered AI usage detected: ${shadowCheck.confirmedShadowCount} confirmed Shadow AI system${shadowCheck.confirmedShadowCount !== 1 ? 's' : ''} linked to this system. Compliance approval may be blocked.`;
  }

  return null;
}

/**
 * Check if compliance approval should be blocked due to Shadow AI
 * @param systemId - The AI system ID
 * @returns Object with shouldBlock flag and reason
 */
export async function shouldBlockComplianceApproval(systemId: string): Promise<{
  shouldBlock: boolean;
  reason: string | null;
}> {
  const shadowCheck = await checkShadowAI(systemId);

  if (shadowCheck.hasShadowAI) {
    return {
      shouldBlock: true,
      reason: `Cannot approve compliance: ${shadowCheck.confirmedShadowCount} confirmed Shadow AI system${shadowCheck.confirmedShadowCount !== 1 ? 's' : ''} detected. Please resolve Shadow AI issues before approval.`,
    };
  }

  return {
    shouldBlock: false,
    reason: null,
  };
}
