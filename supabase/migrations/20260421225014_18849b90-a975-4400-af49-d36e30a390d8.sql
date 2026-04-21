ALTER TABLE public.user_upgrades
  ADD COLUMN IF NOT EXISTS weapon_equipped text NOT NULL DEFAULT 'laser',
  ADD COLUMN IF NOT EXISTS weapons_owned text[] NOT NULL DEFAULT ARRAY['laser'::text];