-- Rollback: Remove the accounts delete policies and function
-- This undoes the changes made in add_accounts_delete_policy.sql

-- Drop the policies
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Admins can delete student accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;

-- Drop the function
DROP FUNCTION IF EXISTS public.is_admin();
