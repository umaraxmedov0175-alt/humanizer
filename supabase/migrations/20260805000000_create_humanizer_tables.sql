-- Create Rewrites table
CREATE TABLE IF NOT EXISTS public.rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  source_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'Business email',
  level TEXT NOT NULL DEFAULT 'B2',
  natural_score INT,
  meaning_score INT,
  rhythm_score INT,
  engine TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create Voice Profiles table
CREATE TABLE IF NOT EXISTS public.voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sample TEXT NOT NULL,
  contractions BOOLEAN NOT NULL DEFAULT true,
  short_paragraphs BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
