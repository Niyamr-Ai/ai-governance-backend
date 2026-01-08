-- Create Discovered AI Assets and Discovery Events tables
-- These tables support AI Asset Discovery & Shadow AI Detection feature

-- Table: discovered_ai_assets
-- Stores discovered AI assets that may or may not be linked to registered systems
CREATE TABLE IF NOT EXISTS discovered_ai_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Discovery Source
  source_type TEXT NOT NULL CHECK (source_type IN ('repo_scan', 'api_scan', 'vendor_detection', 'manual_hint')),
  
  -- Detected Information
  detected_name TEXT NOT NULL,
  detected_description TEXT,
  detected_vendor TEXT CHECK (detected_vendor IN ('OpenAI', 'Anthropic', 'AWS', 'Azure', 'Custom', 'Unknown')),
  detected_endpoint_or_repo TEXT,
  
  -- Confidence and Environment
  confidence_score TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_score IN ('low', 'medium', 'high')),
  environment TEXT CHECK (environment IN ('dev', 'test', 'prod', 'unknown')),
  
  -- Linking and Shadow Status
  linked_system_id UUID, -- References any AI system (EU, MAS, UK, or registry)
  shadow_status TEXT NOT NULL DEFAULT 'potential' CHECK (shadow_status IN ('potential', 'confirmed', 'resolved')),
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: discovery_events
-- Audit trail for discovery actions
CREATE TABLE IF NOT EXISTS discovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to discovered asset
  discovered_asset_id UUID NOT NULL REFERENCES discovered_ai_assets(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'linked', 'marked_shadow', 'resolved')),
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_source_type ON discovered_ai_assets(source_type);
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_shadow_status ON discovered_ai_assets(shadow_status);
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_linked_system_id ON discovered_ai_assets(linked_system_id);
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_created_by ON discovered_ai_assets(created_by);
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_discovered_at ON discovered_ai_assets(discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_ai_assets_last_seen_at ON discovered_ai_assets(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_discovery_events_asset_id ON discovery_events(discovered_asset_id);
CREATE INDEX IF NOT EXISTS idx_discovery_events_event_type ON discovery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_discovery_events_timestamp ON discovery_events(timestamp DESC);

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at on discovered_ai_assets
DROP TRIGGER IF EXISTS update_discovered_ai_assets_updated_at ON discovered_ai_assets;
CREATE TRIGGER update_discovered_ai_assets_updated_at
BEFORE UPDATE ON discovered_ai_assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE discovered_ai_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovery_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can view discovered assets
CREATE POLICY "Authenticated users can view discovered assets"
ON discovered_ai_assets
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: Authenticated users can create discovered assets
CREATE POLICY "Authenticated users can create discovered assets"
ON discovered_ai_assets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Users can update discovered assets (for linking, marking shadow, etc.)
-- Only admins/owners can confirm shadow AI or link assets
CREATE POLICY "Users can update discovered assets"
ON discovered_ai_assets
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- Creator can update
    created_by = auth.uid()
    OR
    -- Admins can update
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
    )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
    )
  )
);

-- RLS Policy: Only admins can delete discovered assets
CREATE POLICY "Only admins can delete discovered assets"
ON discovered_ai_assets
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'role' = 'admin' OR raw_user_meta_data->>'role' = 'Admin')
  )
);

-- RLS Policy: Authenticated users can view discovery events
CREATE POLICY "Authenticated users can view discovery events"
ON discovery_events
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- RLS Policy: System can create discovery events (via API)
CREATE POLICY "Authenticated users can create discovery events"
ON discovery_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON TABLE discovered_ai_assets IS 'Stores discovered AI assets that may be shadow AI or unregistered systems';
COMMENT ON TABLE discovery_events IS 'Audit trail for discovery actions (detected, linked, marked_shadow, resolved)';
COMMENT ON COLUMN discovered_ai_assets.linked_system_id IS 'References any AI system ID (EU, MAS, UK assessment, or registry system_id)';
COMMENT ON COLUMN discovered_ai_assets.shadow_status IS 'potential: not yet linked, confirmed: confirmed as shadow AI, resolved: linked or false positive';
