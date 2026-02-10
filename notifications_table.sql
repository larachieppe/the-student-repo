-- Create notifications table for student notifications
-- This table stores notifications for students when their pipeline stage changes

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'stage_change',
  old_stage TEXT,
  new_stage TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries by student_id
CREATE INDEX idx_notifications_student_id ON notifications(student_id);

-- Create index for faster queries by company_id
CREATE INDEX idx_notifications_company_id ON notifications(company_id);

-- Create index for filtering unread notifications
CREATE INDEX idx_notifications_read ON notifications(read);

-- Create index for sorting by created_at
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Students can read their own notifications
-- Uses auth.jwt() which is accessible without querying auth.users
CREATE POLICY "Students can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (student_id IN (
    SELECT id FROM submissions WHERE email = LOWER(auth.jwt()->>'email')
  ));

-- Policy: Students can update their own notifications (mark as read)
CREATE POLICY "Students can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (student_id IN (
    SELECT id FROM submissions WHERE email = LOWER(auth.jwt()->>'email')
  ));

-- Policy: Allow insert for authenticated users (used by application code)
-- In practice, this will be companies updating pipeline stages
CREATE POLICY "Allow notifications insert"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Admin can view all notifications
CREATE POLICY "Admins can view all notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

COMMENT ON TABLE notifications IS 'Stores notifications for students about pipeline stage changes and messages';
COMMENT ON COLUMN notifications.student_id IS 'Reference to the student (submissions table)';
COMMENT ON COLUMN notifications.company_id IS 'Reference to the company that triggered the notification';
COMMENT ON COLUMN notifications.message IS 'The notification message displayed to the student';
COMMENT ON COLUMN notifications.type IS 'Type of notification (e.g., stage_change, message)';
COMMENT ON COLUMN notifications.old_stage IS 'Previous pipeline stage (optional, for stage_change type)';
COMMENT ON COLUMN notifications.new_stage IS 'New pipeline stage (optional, for stage_change type)';
COMMENT ON COLUMN notifications.conversation_id IS 'Reference to the conversation (optional, for message type)';
COMMENT ON COLUMN notifications.read IS 'Whether the student has read this notification';
COMMENT ON COLUMN notifications.created_at IS 'Timestamp when notification was created';
