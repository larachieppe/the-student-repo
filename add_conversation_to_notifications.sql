-- Migration: Add conversation_id column to notifications table
-- Run this if you already created the notifications table without conversation_id

-- Add conversation_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE public.notifications
    ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

    COMMENT ON COLUMN public.notifications.conversation_id IS 'Reference to the conversation (optional, for message type)';
  END IF;
END $$;
