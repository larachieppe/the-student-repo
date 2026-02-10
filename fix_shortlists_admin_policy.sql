-- Fix RLS policies to allow admins to read all data for analytics
-- This fixes the analytics page showing incorrect counts for companies

-- Ensure the is_admin() function exists (from fix_accounts_read_policy.sql)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Fix shortlists table: Allow admins to view all shortlists
DROP POLICY IF EXISTS "Business users see own company shortlists" ON public.shortlists;

CREATE POLICY "Admins and business users can view shortlists"
ON public.shortlists
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Fix student_pipeline table: Allow admins to view all pipeline data
DROP POLICY IF EXISTS "Companies can view their own pipeline" ON public.student_pipeline;

CREATE POLICY "Admins and companies can view pipeline"
ON public.student_pipeline
FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR company_id IN (
    SELECT company_id FROM public.accounts WHERE id = auth.uid()
  )
);
