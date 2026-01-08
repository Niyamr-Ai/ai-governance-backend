-- Fix RLS Policy to allow status change from 'draft' to 'submitted'
-- This migration fixes the issue where submitting a risk assessment fails
-- due to RLS policy violation

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Creators can update draft assessments" ON risk_assessments;

-- Create updated policy that allows submission
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

-- Add policy for anyone to approve/reject submitted assessments
-- TODO: Later restrict this to admins/compliance only
-- For now, any authenticated user can approve/reject submitted assessments
CREATE POLICY "Anyone can approve or reject submitted assessments"
ON risk_assessments
FOR UPDATE
USING (
  -- Only allow updates if status is 'submitted' and user is authenticated
  status = 'submitted' AND auth.uid() IS NOT NULL
)
WITH CHECK (
  -- Allow status to be 'approved' or 'rejected'
  -- User must be authenticated
  (status = 'approved' OR status = 'rejected') AND auth.uid() IS NOT NULL
);
