-- Usage tracking (for rate limiting and analytics)
CREATE TABLE IF NOT EXISTS public.fill_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fields_count INTEGER NOT NULL,
  fields_filled INTEGER NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.fill_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own sessions') THEN
        CREATE POLICY "Users can view own sessions" ON public.fill_sessions FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own sessions') THEN
        CREATE POLICY "Users can insert own sessions" ON public.fill_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END
$$;
