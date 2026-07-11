-- Update profiles role check constraint to allow 'evaluador'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('dev', 'admin', 'evaluador'));
