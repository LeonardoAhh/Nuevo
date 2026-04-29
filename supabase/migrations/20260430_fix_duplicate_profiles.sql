-- Fix duplicate profiles: keep oldest row per user_id, delete the rest
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.profiles
  ORDER BY user_id, created_at ASC
);

-- Prevent future duplicates
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
