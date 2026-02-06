-- Create student_pipeline table to track current stage of students for each company
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

-- Create stage_history table for audit trail
CREATE TABLE IF NOT EXISTS public.stage_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.student_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Companies can only see their own pipeline data
CREATE POLICY "Companies can view their own pipeline"
ON public.student_pipeline FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.accounts WHERE id = auth.uid()
  )
);

-- RLS Policy: Companies can insert/update their own pipeline data
CREATE POLICY "Companies can manage their own pipeline"
ON public.student_pipeline FOR ALL TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.accounts WHERE id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.accounts WHERE id = auth.uid()
  )
);

-- RLS Policy: Companies can view their own stage history
CREATE POLICY "Companies can view their own stage history"
ON public.stage_history FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.accounts WHERE id = auth.uid()
  )
);

-- Function to log stage changes to history
CREATE OR REPLACE FUNCTION log_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.stage_history (company_id, student_id, stage, notes)
  VALUES (NEW.company_id, NEW.student_id, NEW.stage, NEW.notes);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log stage changes
DROP TRIGGER IF EXISTS pipeline_stage_change_trigger ON public.student_pipeline;
CREATE TRIGGER pipeline_stage_change_trigger
AFTER INSERT OR UPDATE OF stage ON public.student_pipeline
FOR EACH ROW
EXECUTE FUNCTION log_stage_change();
