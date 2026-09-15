/*
# Switch RLS policies from anon to authenticated

1. Overview
Previously all tables allowed anon + authenticated access (single-tenant, no login).
Now that the app has a sign-in screen, policies must require an authenticated session.
The anon role (unauthenticated) will no longer be able to read or write any data.

2. Modified Tables
- access_points, students, devices, sessions, tickets

3. Security Changes
- All SELECT/INSERT/UPDATE/DELETE policies changed from TO anon, authenticated
  to TO authenticated only.
- USING (true) / WITH CHECK (true) kept because this is an admin dashboard —
  any authenticated admin can manage all data. The gate is authentication itself,
  not per-row ownership.
*/

-- access_points
DROP POLICY IF EXISTS "anon_select_access_points" ON access_points;
DROP POLICY IF EXISTS "anon_insert_access_points" ON access_points;
DROP POLICY IF EXISTS "anon_update_access_points" ON access_points;
DROP POLICY IF EXISTS "anon_delete_access_points" ON access_points;

CREATE POLICY "select_access_points" ON access_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_access_points" ON access_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_access_points" ON access_points FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_access_points" ON access_points FOR DELETE TO authenticated USING (true);

-- students
DROP POLICY IF EXISTS "anon_select_students" ON students;
DROP POLICY IF EXISTS "anon_insert_students" ON students;
DROP POLICY IF EXISTS "anon_update_students" ON students;
DROP POLICY IF EXISTS "anon_delete_students" ON students;

CREATE POLICY "select_students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_students" ON students FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_students" ON students FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_students" ON students FOR DELETE TO authenticated USING (true);

-- devices
DROP POLICY IF EXISTS "anon_select_devices" ON devices;
DROP POLICY IF EXISTS "anon_insert_devices" ON devices;
DROP POLICY IF EXISTS "anon_update_devices" ON devices;
DROP POLICY IF EXISTS "anon_delete_devices" ON devices;

CREATE POLICY "select_devices" ON devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_devices" ON devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_devices" ON devices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_devices" ON devices FOR DELETE TO authenticated USING (true);

-- sessions
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;

CREATE POLICY "select_sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_sessions" ON sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_sessions" ON sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_sessions" ON sessions FOR DELETE TO authenticated USING (true);

-- tickets
DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;

CREATE POLICY "select_tickets" ON tickets FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_tickets" ON tickets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_tickets" ON tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_tickets" ON tickets FOR DELETE TO authenticated USING (true);
