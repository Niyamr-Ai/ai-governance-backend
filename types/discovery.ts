/**
 * TypeScript types for AI Asset Discovery & Shadow AI Detection
 */

export type DiscoverySourceType = 'repo_scan' | 'api_scan' | 'vendor_detection' | 'manual_hint';
export type DetectedVendor = 'OpenAI' | 'Anthropic' | 'AWS' | 'Azure' | 'Custom' | 'Unknown';
export type ConfidenceScore = 'low' | 'medium' | 'high';
export type Environment = 'dev' | 'test' | 'prod' | 'unknown';
export type ShadowStatus = 'potential' | 'confirmed' | 'resolved';
export type DiscoveryEventType = 'detected' | 'linked' | 'marked_shadow' | 'resolved';


/**
 * Base type used by frontend & services (no DB timestamps)
 */
export interface BaseDiscoveredAIAsset {
  id: string;
  source_type: DiscoverySourceType;
  detected_name: string;
  detected_description?: string | null;
  detected_vendor?: DetectedVendor | null;
  detected_endpoint_or_repo?: string | null;
  confidence_score: ConfidenceScore;
  environment?: Environment | null;
  linked_system_id?: string | null;
  shadow_status: ShadowStatus;
  created_by?: string | null;
  metadata?: Record<string, any> | null;
}

export interface DiscoveredAIAsset extends BaseDiscoveredAIAsset {
  discovered_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiscoveryEvent {
  id: string;
  discovered_asset_id: string;
  event_type: DiscoveryEventType;
  performed_by?: string | null;
  notes?: string | null;
  timestamp: string;
}

export interface CreateDiscoveredAssetInput {
  source_type: DiscoverySourceType;
  detected_name: string;
  detected_description?: string;
  detected_vendor?: DetectedVendor;
  detected_endpoint_or_repo?: string;
  confidence_score?: ConfidenceScore;
  environment?: Environment;
  metadata?: Record<string, any>;
}

export interface UpdateDiscoveredAssetInput {
  detected_name?: string;
  detected_description?: string;
  detected_vendor?: DetectedVendor;
  detected_endpoint_or_repo?: string;
  confidence_score?: ConfidenceScore;
  environment?: Environment;
  linked_system_id?: string | null;
  shadow_status?: ShadowStatus;
  metadata?: Record<string, any>;
}

export interface LinkAssetInput {
  linked_system_id: string;
  notes?: string;
}

export interface MarkShadowInput {
  notes?: string;
}

export interface ResolveAssetInput {
  notes?: string;
}

export interface CreateSystemFromAssetInput {
  system_name: string;
  description?: string;
  owner?: string;
  notes?: string;
}
