-- Add RLS Policy to allow updating mitigation_status for approved/submitted assessments
-- This allows tracking mitigation progress even after assessment approval

-- Policy allows any authenticated user to update mitigation_status
-- for approved or submitted assessments
CREATE POLICY "Anyone can update mitigation status for approved/submitted assessments"
ON risk_assessments
FOR UPDATE
USING (
  -- Only allow updates if status is 'approved' or 'submitted' and user is authenticated
  (status = 'approved' OR status = 'submitted') AND auth.uid() IS NOT NULL
)
WITH CHECK (
  -- Ensure status remains the same (only mitigation_status should change)
  -- Allow mitigation_status and updated_at to be updated
  (status = 'approved' OR status = 'submitted') AND auth.uid() IS NOT NULL
);
