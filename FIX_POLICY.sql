-- Run this ENTIRE script in Supabase SQL Editor to fix all issues
-- This also removes the UNIQUE constraint on document_number if it exists

-- Remove UNIQUE constraint on document_number if it exists
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_number_key;

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Government can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Citizens can view own applications" ON applications;
DROP POLICY IF EXISTS "Citizens can create applications" ON applications;
DROP POLICY IF EXISTS "Government can view all applications" ON applications;
DROP POLICY IF EXISTS "Government can update applications" ON applications;
DROP POLICY IF EXISTS "Citizens can view own documents" ON documents;
DROP POLICY IF EXISTS "Government can view all documents" ON documents;
DROP POLICY IF EXISTS "Government can update documents" ON documents;
DROP POLICY IF EXISTS "Government can create documents" ON documents;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications for users" ON notifications;

-- 2. Recreate profiles policies (simple, no self-reference)
CREATE POLICY "profiles_select_policy"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "profiles_update_policy"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 3. Recreate applications policies
CREATE POLICY "applications_select_policy"
  ON applications FOR SELECT
  USING (auth.uid() = citizen_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'government'));

CREATE POLICY "applications_insert_policy"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "applications_update_policy"
  ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'government'));

-- 4. Recreate documents policies
CREATE POLICY "documents_select_policy"
  ON documents FOR SELECT
  USING (auth.uid() = citizen_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'government'));

CREATE POLICY "documents_insert_policy"
  ON documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'government'));

CREATE POLICY "documents_update_policy"
  ON documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'government'));

-- 5. Recreate notifications policies
CREATE POLICY "notifications_select_policy"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_policy"
  ON notifications FOR INSERT
  WITH CHECK (true);
