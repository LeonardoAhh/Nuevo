-- Add theme_preferences JSONB column to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme_preferences JSONB DEFAULT '{}'::jsonb;
