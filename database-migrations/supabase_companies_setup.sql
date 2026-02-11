-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  email_domain TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email_domain for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_email_domain ON public.companies(email_domain);

-- Insert companies data (using DO block to handle conflicts on both columns)
DO $$
BEGIN
  INSERT INTO public.companies (name, email_domain) VALUES
    ('InstaLabel', 'instalabel.ai'),
    ('Godela', 'godela.ai'),
    ('TeachShare', 'teachshare.com'),
    ('MagicSchool', 'magicschool.ai'),
    ('Mecha Health', 'mecha-health.ai'),
    ('Asha Health', 'asha.health'),
    ('Straia', 'straia.io'),
    ('Paloma', 'palomalearning.com'),
    ('Innovamat', 'innovamat.com'),
    ('Iago', 'getiago.com'),
    ('GPTZero', 'gptzero.me'),
    ('The Disagreement', 'thedisagreement.com'),
    ('Aprende Institute', 'startcarreiras.com'),
    ('Pathfinder', 'heypathfinder.com'),
    ('KaiPod Learning', 'kaipodlearning.com'),
    ('Replit', 'repl.it'),
    ('WorkWhile', 'workwhilejobs.com'),
    ('Cometa', 'getcometa.com'),
    ('Kanu', 'kanu.us'),
    ('Mainstay', 'mainstay.com'),
    ('Sketchy', 'sketchy.com'),
    ('Suraasa', 'suraasa.com'),
    ('Sira', 'sira.team'),
    ('Swing Education', 'swingeducation.com'),
    ('Doowii', 'doowii.io'),
    ('Handshake', 'joinhandshake.com'),
    ('TeachFX', 'teachfx.com'),
    ('Lando', 'findlando.com'),
    ('Stepful', 'stepful.com'),
    ('Tenor', 'tenorhq.com'),
    ('Immigo', 'immigo.io'),
    ('CoderHouse', 'coderhouse.com'),
    ('Yay', 'theyaycompany.com'),
    ('Ellevation', 'elevatewith.com'),
    ('Lingokids', 'lingokids.com'),
    ('Sprout Labs', 'sproutlabs.com'),
    ('Riipen', 'riipen.com'),
    ('Newsela', 'newsela.com'),
    ('Aura', 'aurahealth.io'),
    ('Cartwheel', 'cartwheelcare.org'),
    ('Outsmart', 'outsmartcollege.com'),
    ('Derivita', 'derivita.com'),
    ('SmartPass', 'smartpass.app'),
    ('CurvePoint', 'curvepoint.ai'),
    ('Preply', 'preply.com'),
    ('NationGraph', 'nationgraph.com'),
    ('Curipod', 'curipod.com'),
    ('Brilliant', 'brilliant.org'),
    ('Desmos', 'desmos.com'),
    ('EveryDay Labs', 'everydaylabs.com'),
    ('Marker Learning', 'markerlearning.com'),
    ('Teachy', 'teachy.ai'),
    ('Spokn', 'getspokn.com'),
    ('Springboard', 'springboard.com'),
    ('Realworld', 'realworld.co'),
    ('Polygence', 'polygence.org'),
    ('Coral Care', 'joincoralcare.com'),
    ('KickUp', 'kickup.co'),
    ('Lovevery', 'lovevery.com'),
    ('FourthRev', 'fourthrev.com'),
    ('Major League Hacking', 'mlh.io'),
    ('AstroMind', 'astromind.com'),
    ('The Podcast App', 'podcastapp.io'),
    ('Take2 AI', 'mytake2.org'),
    ('Kaymbu', 'kaymbu.com'),
    ('PeerTeach', 'peerteach.org'),
    ('BookNook', 'booknook.com'),
    ('ClassDojo', 'classdojo.com')
  ON CONFLICT (name) DO NOTHING;
EXCEPTION
  WHEN unique_violation THEN
    -- If there's a conflict on email_domain, ignore it
    NULL;
END $$;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow public reads (needed for domain checking during login)
CREATE POLICY "Allow public reads on companies"
ON public.companies
FOR SELECT
TO public
USING (true);

-- Ensure accounts table has company_id column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'accounts'
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.accounts ADD COLUMN company_id UUID REFERENCES public.companies(id);
    CREATE INDEX IF NOT EXISTS idx_accounts_company_id ON public.accounts(company_id);
  END IF;
END $$;
