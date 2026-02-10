-- Fix accounts table RLS to allow admins to read all accounts
-- This fixes the issue where account counts show 0 for admins

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
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;

-- Policy: Admins can view all accounts, users can view their own
CREATE POLICY "Admins can view all accounts"
ON public.accounts
FOR SELECT
TO authenticated
USING (
  public.is_admin() OR id = auth.uid()
);
