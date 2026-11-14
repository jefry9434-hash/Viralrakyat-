/*
# Profiles and roles

1. New Tables
- `profiles`: one row per signed-in user (id matches the auth account). Holds display name and role (creator, promoter, or admin).

2. Functions
- `is_admin()`: returns true when the signed-in user has the admin role.
- `handle_new_user()`: runs after sign-up and creates the profile. Users can only choose creator or promoter at sign-up. Admin must be assigned manually in the database.

3. Security
- Row level security enabled on `profiles`.
- Users can read only their own profile and change only their display name. Role cannot be changed by users.
- Admins can read all profiles.

4. Important notes
- No user can insert profiles directly; only the sign-up trigger creates them.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
  role text NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'promoter', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, role)
  VALUES (
    NEW.id,
    LEFT(COALESCE(NEW.raw_user_meta_data->>'display_name', ''), 80),
    CASE WHEN NEW.raw_user_meta_data->>'role' = 'promoter' THEN 'promoter' ELSE 'creator' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
CREATE POLICY "profiles_select_admin" ON profiles FOR SELECT
TO authenticated USING (is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
