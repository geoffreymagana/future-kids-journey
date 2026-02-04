-- Create table for parent interest registrations
CREATE TABLE public.parent_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  age_range TEXT NOT NULL,
  referral_id TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for share tracking
CREATE TABLE public.share_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parent_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for interest form submissions (no auth required)
CREATE POLICY "Anyone can submit interest"
  ON public.parent_interests
  FOR INSERT
  WITH CHECK (true);

-- Allow reading counts only (used for counters)
CREATE POLICY "Anyone can read interest counts"
  ON public.parent_interests
  FOR SELECT
  USING (true);

-- Allow anonymous inserts for share tracking
CREATE POLICY "Anyone can track shares"
  ON public.share_events
  FOR INSERT
  WITH CHECK (true);

-- Allow reading share counts
CREATE POLICY "Anyone can read share counts"
  ON public.share_events
  FOR SELECT
  USING (true);

-- Enable realtime for live counters
ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_interests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.share_events;