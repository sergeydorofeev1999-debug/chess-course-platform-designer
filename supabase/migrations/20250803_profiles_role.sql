-- ============================================
-- MIGRATION: Add role column to profiles table
-- Date: 2025-08-03
-- ============================================

-- Add role column with CHECK constraint for valid roles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Add CHECK constraint for valid role values
DO $$
BEGIN
  -- Drop existing constraint if it exists (idempotent)
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
  
  -- Add new constraint
  ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'coach', 'admin'));
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Constraint already exists, ignore
END $$;

-- ============================================
-- RLS: Update profiles policies to include role check
-- ============================================

-- Allow users to update own profile (for name/avatar, NOT role)
DROP POLICY IF EXISTS "upd_profiles" ON profiles;
CREATE POLICY "upd_profiles" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Allow admin to update any profile (including role)
DROP POLICY IF EXISTS "adm_upd_profiles" ON profiles;
CREATE POLICY "adm_upd_profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- Function: Set default role on new profile creation
-- ============================================

-- Update handle_new_user to set role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
