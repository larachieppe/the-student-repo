-- Add company profile fields for businesses to update in their dashboard
-- This allows companies to showcase their hiring needs, open roles, and what they look for

DO $$
BEGIN
  -- Company description/about
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN description TEXT;
  END IF;

  -- Company type (Startup, Scale-up, Enterprise, Non-profit, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'company_type'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN company_type TEXT;
  END IF;

  -- Industry/sector
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN industry TEXT;
  END IF;

  -- Company size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN company_size TEXT;
  END IF;

  -- Website URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'website'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN website TEXT;
  END IF;

  -- Logo URL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN logo_url TEXT;
  END IF;

  -- Open roles (JSON array or text)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'open_roles'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN open_roles TEXT;
  END IF;

  -- Hiring needs/what we're looking for
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'hiring_needs'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN hiring_needs TEXT;
  END IF;

  -- What we look for in candidates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'candidate_requirements'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN candidate_requirements TEXT;
  END IF;

  -- Tech stack/skills needed (array)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'tech_stack'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN tech_stack TEXT[];
  END IF;

  -- Perks/benefits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'perks'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN perks TEXT;
  END IF;

  -- Location/headquarters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN location TEXT;
  END IF;

  -- Remote work policy
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'remote_policy'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN remote_policy TEXT;
  END IF;

  -- Is actively hiring
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'is_hiring'
  ) THEN
    ALTER TABLE public.companies ADD COLUMN is_hiring BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add RLS policy for companies to update their own profile
DROP POLICY IF EXISTS "Companies can update their own profile" ON public.companies;
CREATE POLICY "Companies can update their own profile"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
)
WITH CHECK (
  id IN (
    SELECT company_id
    FROM public.accounts
    WHERE id = auth.uid()
    AND role = 'business'
  )
);
