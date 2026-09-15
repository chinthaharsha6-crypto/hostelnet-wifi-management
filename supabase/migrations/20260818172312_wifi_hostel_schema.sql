/*
# Wifi Network Management for Student Hostel

1. Overview
This migration creates the full schema for managing wifi network connectivity
in a student hostel. It tracks access points (routers) across floors, resident
students and their wifi access, registered devices, connection sessions, and
support tickets for connectivity issues.

No sign-in is required (admin dashboard), so this is a single-tenant schema
with anon + authenticated access on all tables.

2. New Tables
- access_points: wifi routers deployed across hostel floors/buildings
  - id (uuid pk), name (text), location (text, e.g. "Floor 2 - Corridor A"),
    status (text: online/offline/warning), ip_address (text), mac_address (text),
    connected_clients (int), max_clients (int), firmware_version (text),
    installed_at (date), last_seen (timestamptz)
- students: hostel residents with wifi access
  - id (uuid pk), full_name (text), room_number (text), email (text unique),
    phone (text), wifi_status (text: active/suspended/pending), plan (text:
    basic/premium/unlimited), data_used_mb (numeric), data_cap_mb (numeric),
    created_at (timestamptz)
- devices: devices registered by students
  - id (uuid pk), student_id (uuid fk -> students), device_name (text),
    mac_address (text), platform (text: Windows/macOS/Android/iOS/Linux/Other),
    last_connected_at (timestamptz), status (text: connected/idle/offline)
- sessions: connection session logs
  - id (uuid pk), device_id (uuid fk -> devices), access_point_id (uuid fk -> access_points),
    connected_at (timestamptz), disconnected_at (timestamptz), data_used_mb (numeric),
    status (text: active/completed/dropped)
- tickets: support tickets for wifi issues
  - id (uuid pk), student_id (uuid fk -> students), subject (text), description (text),
    status (text: open/in_progress/resolved), priority (text: low/medium/high/urgent),
    created_at (timestamptz), resolved_at (timestamptz)

3. Indexes
- devices.student_id, sessions.device_id, sessions.access_point_id,
  tickets.student_id, tickets.status

4. Security
- RLS enabled on all tables.
- All tables allow anon + authenticated full CRUD (single-tenant admin dashboard).
*/

-- Access Points
CREATE TABLE IF NOT EXISTS access_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  status text NOT NULL DEFAULT 'online',
  ip_address text,
  mac_address text,
  connected_clients integer NOT NULL DEFAULT 0,
  max_clients integer NOT NULL DEFAULT 50,
  firmware_version text DEFAULT '1.0.0',
  installed_at date DEFAULT CURRENT_DATE,
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE access_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_access_points" ON access_points;
CREATE POLICY "anon_select_access_points" ON access_points FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_access_points" ON access_points;
CREATE POLICY "anon_insert_access_points" ON access_points FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_access_points" ON access_points;
CREATE POLICY "anon_update_access_points" ON access_points FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_access_points" ON access_points;
CREATE POLICY "anon_delete_access_points" ON access_points FOR DELETE TO anon, authenticated USING (true);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  room_number text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  wifi_status text NOT NULL DEFAULT 'pending',
  plan text NOT NULL DEFAULT 'basic',
  data_used_mb numeric NOT NULL DEFAULT 0,
  data_cap_mb numeric NOT NULL DEFAULT 10240,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE TO anon, authenticated USING (true);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  device_name text NOT NULL,
  mac_address text NOT NULL,
  platform text NOT NULL DEFAULT 'Other',
  last_connected_at timestamptz,
  status text NOT NULL DEFAULT 'offline',
  CONSTRAINT valid_device_status CHECK (status IN ('connected','idle','offline'))
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_devices" ON devices;
CREATE POLICY "anon_select_devices" ON devices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_devices" ON devices;
CREATE POLICY "anon_insert_devices" ON devices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_devices" ON devices;
CREATE POLICY "anon_update_devices" ON devices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_devices" ON devices;
CREATE POLICY "anon_delete_devices" ON devices FOR DELETE TO anon, authenticated USING (true);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  access_point_id uuid NOT NULL REFERENCES access_points(id) ON DELETE CASCADE,
  connected_at timestamptz NOT NULL DEFAULT now(),
  disconnected_at timestamptz,
  data_used_mb numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tickets" ON tickets;
CREATE POLICY "anon_select_tickets" ON tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
CREATE POLICY "anon_insert_tickets" ON tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_tickets" ON tickets;
CREATE POLICY "anon_update_tickets" ON tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_tickets" ON tickets;
CREATE POLICY "anon_delete_tickets" ON tickets FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_devices_student_id ON devices(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_device_id ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_point_id ON sessions(access_point_id);
CREATE INDEX IF NOT EXISTS idx_tickets_student_id ON tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
