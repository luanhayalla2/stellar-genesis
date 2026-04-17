-- Migration to add drone_count column to user_upgrades table
ALTER TABLE public.user_upgrades 
ADD COLUMN drone_count INTEGER NOT NULL DEFAULT 0;
