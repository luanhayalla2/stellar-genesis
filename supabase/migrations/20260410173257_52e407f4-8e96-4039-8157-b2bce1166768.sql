
-- Create user_upgrades table for persistent shop upgrades
CREATE TABLE public.user_upgrades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_hp_bonus INTEGER NOT NULL DEFAULT 0,
  damage_bonus INTEGER NOT NULL DEFAULT 0,
  speed_bonus INTEGER NOT NULL DEFAULT 0,
  shield_duration_bonus INTEGER NOT NULL DEFAULT 0,
  score_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_upgrades ENABLE ROW LEVEL SECURITY;

-- Users can view their own upgrades
CREATE POLICY "Users can view their own upgrades"
  ON public.user_upgrades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own upgrades
CREATE POLICY "Users can insert their own upgrades"
  ON public.user_upgrades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own upgrades
CREATE POLICY "Users can update their own upgrades"
  ON public.user_upgrades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.scores;
