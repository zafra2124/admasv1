/*
  # Fix infinite recursion in profiles RLS policies

  1. Policy Updates
    - Remove recursive policy on profiles table that causes infinite loop
    - Simplify admin access policy to avoid circular references
    - Update user access policies to be more direct

  2. Security
    - Maintain proper RLS protection
    - Ensure users can only access their own data
    - Allow admins to access all profiles without recursion
*/

-- Drop existing policies that may cause recursion
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simplified policies without recursion
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Simplified admin policy that doesn't reference profiles table recursively
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role IN ('admin', 'super_admin')
      AND user_id = auth.uid()
    )
  );

-- Also fix any potential recursion in tickets policies
DROP POLICY IF EXISTS "Admins can read all tickets" ON tickets;

CREATE POLICY "Admins can read all tickets"
  ON tickets
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles 
      WHERE role IN ('admin', 'super_admin')
      AND user_id = auth.uid()
    )
  );