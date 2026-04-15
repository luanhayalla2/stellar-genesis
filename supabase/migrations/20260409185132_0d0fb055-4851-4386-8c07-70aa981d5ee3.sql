-- Create scores table for global ranking
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  wave INTEGER NOT NULL DEFAULT 1,
  asteroids_destroyed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Everyone can see the leaderboard
CREATE POLICY "Scores are viewable by everyone"
  ON public.scores FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert their own scores"
  ON public.scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for ranking queries
CREATE INDEX idx_scores_score ON public.scores(score DESC);
CREATE INDEX idx_scores_user ON public.scores(user_id);