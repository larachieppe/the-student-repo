-- Create Pipeline Tracking Tables
-- This enables companies to track student stages (Shortlisted → Contacted → Interviewing → Hired)

-- 1. Create student_pipeline table
-- Tracks current stage of each student for each company
CREATE TABLE IF NOT EXISTS public.student_pipeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('shortlisted', 'contacted', 'interviewing', 'hired', 'not_a_fit')),
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(company_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pipeline_company_id ON public.student_pipeline(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_student_id ON public.student_pipeline(student_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON public.student_pipeline(stage);

-- 2. Create stage_history table
-- Audit trail of all stage changes for analytics
CREATE TABLE IF NOT EXISTS public.stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_history_company_id ON public.stage_history(company_id);
CREATE INDEX IF NOT EXISTS idx_history_student_id ON public.stage_history(student_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON public.stage_history(created_at);

-- 3. Enable RLS on student_pipeline
ALTER TABLE public.student_pipeline ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business users see own company pipeline" ON public.student_pipeline;
DROP POLICY IF EXISTS "Business users insert own company pipeline" ON public.student_pipeline;
DROP POLICY IF EXISTS "Business users update own company pipeline" ON public.student_pipeline;
DROP POLICY IF EXISTS "Business users delete own company pipeline" ON public.student_pipeline;
DROP POLICY IF EXISTS "Admin users see all pipeline" ON public.student_pipeline;

-- Policy: Business users can only see their own company's pipeline
CREATE POLICY "Business users see own company pipeline"
ON public.student_pipeline
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only insert pipeline entries for their company
CREATE POLICY "Business users insert own company pipeline"
ON public.student_pipeline
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only update their own company's pipeline
CREATE POLICY "Business users update own company pipeline"
ON public.student_pipeline
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can delete their own company's pipeline entries
CREATE POLICY "Business users delete own company pipeline"
ON public.student_pipeline
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Admin users can see all pipeline data
CREATE POLICY "Admin users see all pipeline"
ON public.student_pipeline
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 4. Enable RLS on stage_history
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business users see own company history" ON public.stage_history;
DROP POLICY IF EXISTS "Business users insert own company history" ON public.stage_history;
DROP POLICY IF EXISTS "Admin users see all history" ON public.stage_history;

-- Policy: Business users can only see their own company's history
CREATE POLICY "Business users see own company history"
ON public.stage_history
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only insert history for their company
CREATE POLICY "Business users insert own company history"
ON public.stage_history
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Admin users can see all history
CREATE POLICY "Admin users see all history"
ON public.stage_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- 5. Create trigger to automatically log stage changes to history
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into stage_history whenever pipeline stage is updated or inserted
  INSERT INTO public.stage_history (company_id, student_id, stage, notes)
  VALUES (NEW.company_id, NEW.student_id, NEW.stage, NEW.notes);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS pipeline_stage_change_trigger ON public.student_pipeline;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER pipeline_stage_change_trigger
AFTER INSERT OR UPDATE OF stage
ON public.student_pipeline
FOR EACH ROW
EXECUTE FUNCTION log_stage_change();
