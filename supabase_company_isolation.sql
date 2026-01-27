-- Company Isolation Schema Updates
-- This file adds company-specific data isolation for shortlists and conversations

-- 1. Create shortlists table (NEW)
-- Each company has their own shortlist of students they're interested in
CREATE TABLE IF NOT EXISTS public.shortlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,  -- references submissions.id (TEXT since submissions.id might be string)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, student_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shortlists_company_id ON public.shortlists(company_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_student_id ON public.shortlists(student_id);

-- Enable RLS on shortlists
ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Business users see own company shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "Business users insert own company shortlists" ON public.shortlists;
DROP POLICY IF EXISTS "Business users delete own company shortlists" ON public.shortlists;

-- Policy: Business users can only see their own company's shortlists
CREATE POLICY "Business users see own company shortlists"
ON public.shortlists
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only insert shortlists for their company
CREATE POLICY "Business users insert own company shortlists"
ON public.shortlists
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only delete their own company's shortlists
CREATE POLICY "Business users delete own company shortlists"
ON public.shortlists
FOR DELETE
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- 2. Add company_id and student_id to conversations table (UPDATE EXISTING)
-- Each conversation belongs to a specific company and is with a specific student
-- Note: student_id is from submissions table (not auth.users)
DO $$
BEGIN
  -- Add company_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_conversations_company_id ON public.conversations(company_id);
  END IF;

  -- Add student_id if it doesn't exist (tracks which student from submissions table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'conversations'
    AND column_name = 'student_id'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN student_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
  END IF;
END $$;

-- Add unique constraint on company_id and student_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'conversations_company_student_unique'
  ) THEN
    ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_company_student_unique
    UNIQUE (company_id, student_id);
  END IF;
END $$;

-- Enable RLS on conversations (if not already enabled)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Business users see own company conversations" ON public.conversations;
DROP POLICY IF EXISTS "Students see own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Business users insert own company conversations" ON public.conversations;
DROP POLICY IF EXISTS "Business users update own company conversations" ON public.conversations;

-- Policy: Allow authenticated users to see conversations (filter in application code)
CREATE POLICY "Business users see own company conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (true);

-- Policy: Business users can only insert conversations for their company
CREATE POLICY "Business users insert own company conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- Policy: Business users can only update their own company's conversations
CREATE POLICY "Business users update own company conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);

-- 3. Add RLS policies for messages (to ensure proper scoping through conversations)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users see messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users insert messages in their conversations" ON public.messages;

-- Policy: Users can only see messages in conversations they have access to
CREATE POLICY "Users see messages in their conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE
      -- Business users see their company's conversations
      (company_id IN (
        SELECT company_id
        FROM public.accounts
        WHERE id = auth.uid()
        AND role = 'business'
      ))
      OR
      -- Students see conversations they're a participant in
      (EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
      ))
  )
);

-- Policy: Users can only insert messages in conversations they have access to
CREATE POLICY "Users insert messages in their conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE
      -- Business users insert in their company's conversations
      (company_id IN (
        SELECT company_id
        FROM public.accounts
        WHERE id = auth.uid()
        AND role = 'business'
      ))
      OR
      -- Students insert in conversations they're a participant in
      (EXISTS (
        SELECT 1
        FROM public.conversation_participants
        WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
      ))
  )
);

-- 4. Add RLS policy for conversation_participants
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users see participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users insert participants in their conversations" ON public.conversation_participants;

-- Policy: Users can see all participants (simplified to avoid recursion)
CREATE POLICY "Users see participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (true);

-- Policy: Business users can insert participants in their company's conversations
CREATE POLICY "Users insert participants in their conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations
    WHERE company_id IN (
      SELECT company_id
      FROM public.accounts
      WHERE id = auth.uid()
      AND role = 'business'
    )
  )
  OR
  user_id = auth.uid()
);
