-- Add RLS policies for accounts table to allow admins to delete student accounts
-- This enables the delete functionality in the admin dashboard

-- Enable RLS on accounts table (if not already enabled)
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if current user is admin
-- This function bypasses RLS to avoid infinite recursion
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

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can delete student accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;

-- Policy: Admins can view all accounts, users can view their own
CREATE POLICY "Admins can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
);

-- Policy: Admins can delete student accounts only
CREATE POLICY "Admins can delete student accounts"
ON public.accounts
FOR DELETE
TO authenticated
USING (
  public.is_admin()
  AND role = 'student'  -- Only allow deletion of student accounts
);
