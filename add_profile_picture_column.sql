-- Add profile_picture_url column to submissions table
-- This allows students to upload and store profile pictures

DO $$
BEGIN
  -- Add profile_picture_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'submissions'
    AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE public.submissions ADD COLUMN profile_picture_url TEXT;
  END IF;
END $$;
