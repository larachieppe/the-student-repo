-- Fix notifications RLS policies to avoid auth.users table access issues
-- Run this to fix the "permission denied for table users" error

-- Drop the old policies
DROP POLICY IF EXISTS "Students can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Students can update their own notifications" ON notifications;

-- Recreate policies using auth.jwt() instead of auth.users
-- This avoids permission issues since auth.jwt() is accessible to all authenticated users

CREATE POLICY "Students can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM submissions WHERE email = LOWER(auth.jwt()->>'email')
  ));

CREATE POLICY "Students can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (student_id IN (
    SELECT id FROM submissions WHERE email = LOWER(auth.jwt()->>'email')
  ));
