ALTER TABLE public.user_upgrades 
ADD COLUMN IF NOT EXISTS drone_count integer NOT NULL DEFAULT 0;