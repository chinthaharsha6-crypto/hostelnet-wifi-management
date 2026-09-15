import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AccessPoint = {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  ip_address: string | null;
  mac_address: string | null;
  connected_clients: number;
  max_clients: number;
  firmware_version: string;
  installed_at: string;
  last_seen: string;
};

export type Student = {
  id: string;
  full_name: string;
  room_number: string;
  email: string;
  phone: string | null;
  wifi_status: 'active' | 'suspended' | 'pending';
  plan: 'basic' | 'premium' | 'unlimited';
  data_used_mb: number;
  data_cap_mb: number;
  created_at: string;
};

export type Device = {
  id: string;
  student_id: string;
  device_name: string;
  mac_address: string;
  platform: 'Windows' | 'macOS' | 'Android' | 'iOS' | 'Linux' | 'Other';
  last_connected_at: string | null;
  status: 'connected' | 'idle' | 'offline';
};

export type Session = {
  id: string;
  device_id: string;
  access_point_id: string;
  connected_at: string;
  disconnected_at: string | null;
  data_used_mb: number;
  status: 'active' | 'completed' | 'dropped';
};

export type Ticket = {
  id: string;
  student_id: string;
  subject: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  resolved_at: string | null;
};
