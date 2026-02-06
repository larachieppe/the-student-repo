-- Add RLS policies for students to update their own submissions
-- This allows students to edit their profile in the student portal

-- Enable RLS on submissions table (if not already enabled)
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can read their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Business and admin can read all submissions" ON public.submissions;

-- Policy: Students can read their own submissions (using auth.jwt())
CREATE POLICY "Students can read their own submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  email = auth.jwt()->>'email'
);

-- Policy: Students can update their own submissions (using auth.jwt())
CREATE POLICY "Students can update their own submissions"
ON public.submissions
FOR UPDATE
TO authenticated
USING (
  email = auth.jwt()->>'email'
)
WITH CHECK (
  email = auth.jwt()->>'email'
);

-- Policy: Allow upsert for students (for profile updates)
CREATE POLICY "Students can insert their own submissions"
ON public.submissions
FOR INSERT
TO authenticated
WITH CHECK (
  email = auth.jwt()->>'email'
);

-- Policy: Allow public (unauthenticated) to insert submissions (for form page)
CREATE POLICY "Public can insert submissions"
ON public.submissions
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow business and admin users to read all submissions
CREATE POLICY "Business and admin can read all submissions"
ON public.submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.accounts
    WHERE id = auth.uid()
    AND role IN ('business', 'admin')
  )
);
