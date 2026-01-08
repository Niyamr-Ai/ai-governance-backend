-- Governance Tasks / To-Do feature
-- Adds governance_tasks table with audit-friendly constraints

CREATE TABLE IF NOT EXISTS governance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  ai_system_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Regulation scope
  regulation TEXT NOT NULL CHECK (regulation IN ('EU', 'UK', 'MAS')),

  -- Workflow status
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Blocked')),
  blocking BOOLEAN NOT NULL DEFAULT FALSE,

  -- Optional evidence + linkage
  evidence_link TEXT,
  related_entity_id UUID,
  related_entity_type TEXT CHECK (related_entity_type IN ('risk_assessment', 'documentation')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Avoid duplicate tasks for the same rule/title per system + regulation
CREATE UNIQUE INDEX IF NOT EXISTS idx_governance_tasks_unique_rule
  ON governance_tasks (ai_system_id, regulation, title);

CREATE INDEX IF NOT EXISTS idx_governance_tasks_status
  ON governance_tasks (status);
CREATE INDEX IF NOT EXISTS idx_governance_tasks_system
  ON governance_tasks (ai_system_id);

-- Trigger: set completed_at when status flips to Completed
CREATE OR REPLACE FUNCTION trg_governance_tasks_set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Completed' AND (OLD.status IS DISTINCT FROM 'Completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_completed_at_on_governance_tasks ON governance_tasks;
CREATE TRIGGER set_completed_at_on_governance_tasks
BEFORE UPDATE ON governance_tasks
FOR EACH ROW
EXECUTE FUNCTION trg_governance_tasks_set_completed_at();

-- Trigger: make completed tasks immutable except evidence_link
CREATE OR REPLACE FUNCTION trg_governance_tasks_lock_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'Completed' THEN
    IF NEW.status <> 'Completed' THEN
      RAISE EXCEPTION 'Completed tasks are immutable';
    END IF;

    IF NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.regulation IS DISTINCT FROM OLD.regulation
       OR NEW.blocking IS DISTINCT FROM OLD.blocking
       OR NEW.related_entity_id IS DISTINCT FROM OLD.related_entity_id
       OR NEW.related_entity_type IS DISTINCT FROM OLD.related_entity_type
    THEN
      RAISE EXCEPTION 'Completed tasks cannot be modified (title/description/regulation/blocking/linkage)';
    END IF;

    -- Allow evidence updates and timestamp preservation; reject completed_at changes
    IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
      RAISE EXCEPTION 'Completed_at cannot be changed after completion';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lock_completed_governance_tasks ON governance_tasks;
CREATE TRIGGER lock_completed_governance_tasks
BEFORE UPDATE ON governance_tasks
FOR EACH ROW
EXECUTE FUNCTION trg_governance_tasks_lock_completed();

-- RLS
ALTER TABLE governance_tasks ENABLE ROW LEVEL SECURITY;

-- Read for any authenticated user
CREATE POLICY "Users can read governance tasks"
ON governance_tasks
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create tasks
CREATE POLICY "Users can create governance tasks"
ON governance_tasks
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Update tasks (status/evidence) - logic constraints handled by trigger
CREATE POLICY "Users can update governance tasks"
ON governance_tasks
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Do not allow deletes to preserve auditability
REVOKE DELETE ON governance_tasks FROM PUBLIC;

COMMENT ON TABLE governance_tasks IS 'Governance To-Do items linked to AI systems';
COMMENT ON COLUMN governance_tasks.blocking IS 'If true, task blocks EU lifecycle transitions';
COMMENT ON COLUMN governance_tasks.status IS 'Pending | Completed | Blocked';
COMMENT ON COLUMN governance_tasks.related_entity_type IS 'Risk assessment or documentation linkage';

