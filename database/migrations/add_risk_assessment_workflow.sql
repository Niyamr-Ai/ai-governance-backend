-- Add governance workflow columns to risk_assessments table
-- This migration adds status, review fields, and workflow support

ALTER TABLE IF EXISTS risk_assessments
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft' 
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

ALTER TABLE IF EXISTS risk_assessments
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS risk_assessments
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE IF EXISTS risk_assessments
ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_reviewed_by ON risk_assessments(reviewed_by);

-- Update existing records to have 'draft' status if null
UPDATE risk_assessments 
SET status = 'draft' 
WHERE status IS NULL;

-- Update RLS Policy for workflow: Only creator can update draft assessments
DROP POLICY IF EXISTS "Admins and assessors can update risk assessments" ON risk_assessments;
DROP POLICY IF EXISTS "Creators can update draft assessments" ON risk_assessments;

-- Policy allows creators to:
-- 1. Edit draft assessments (status remains 'draft')
-- 2. Submit draft assessments (status changes to 'submitted')
-- The API logic ensures only draft can be submitted
CREATE POLICY "Creators can update draft assessments"
ON risk_assessments
FOR UPDATE
USING (
  -- Only allow updates if status is 'draft' and user is the creator
  status = 'draft' AND assessed_by = auth.uid()
)
WITH CHECK (
  -- Allow status to be 'draft' (regular edits) or 'submitted' (submission)
  -- User must be the creator
  (status = 'draft' OR status = 'submitted') AND assessed_by = auth.uid()
);

-- Add comment for documentation
COMMENT ON COLUMN risk_assessments.status IS 'Workflow status: draft (editable), submitted (pending review), approved (counts toward risk), rejected (does not count)';
COMMENT ON COLUMN risk_assessments.reviewed_by IS 'User ID of admin/compliance officer who reviewed the assessment';
COMMENT ON COLUMN risk_assessments.reviewed_at IS 'Timestamp when the assessment was reviewed (approved/rejected)';
COMMENT ON COLUMN risk_assessments.review_comment IS 'Optional comment from reviewer explaining approval/rejection decision';
