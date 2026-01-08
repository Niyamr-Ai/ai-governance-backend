-- Add approval workflow and monitoring fields to automated_risk_assessments table

-- Add approval status and workflow fields
ALTER TABLE automated_risk_assessments
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;

-- Add monitoring fields
ALTER TABLE automated_risk_assessments
ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_frequency_months INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS monitoring_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_monitored_at TIMESTAMP WITH TIME ZONE;

-- Add index for approval status queries
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_approval_status 
ON automated_risk_assessments(approval_status);

-- Add index for next review date (for cron job queries)
CREATE INDEX IF NOT EXISTS idx_automated_risk_assessments_next_review_date 
ON automated_risk_assessments(next_review_date) 
WHERE next_review_date IS NOT NULL AND monitoring_enabled = true;

-- Add comments
COMMENT ON COLUMN automated_risk_assessments.approval_status IS 'Workflow status: pending, approved, rejected, or needs_revision';
COMMENT ON COLUMN automated_risk_assessments.next_review_date IS 'Scheduled date for next periodic review';
COMMENT ON COLUMN automated_risk_assessments.review_frequency_months IS 'Frequency in months for periodic reviews (default: 6)';
COMMENT ON COLUMN automated_risk_assessments.monitoring_enabled IS 'Whether ongoing monitoring is enabled for this assessment';

