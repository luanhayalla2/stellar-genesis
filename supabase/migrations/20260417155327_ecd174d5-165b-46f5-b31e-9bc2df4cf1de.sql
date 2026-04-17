ALTER TABLE public.user_upgrades 
ADD COLUMN IF NOT EXISTS ship_skin text NOT NULL DEFAULT 'default',
ADD COLUMN IF NOT EXISTS ships_owned text[] NOT NULL DEFAULT ARRAY['default'];