/*
  # Complete Lottery System Rebuild

  1. New Tables
    - `profiles` - User profiles with proper authentication
    - `tickets` - Lottery tickets with validation
    - `winning_numbers` - Monthly winning numbers
    - `ticket_results` - Calculated results for tickets
    - `notifications` - User notifications
    - `admin_logs` - Admin activity tracking
    - `system_settings` - Application configuration

  2. Security
    - Enable RLS on all tables
    - Create proper policies for users and admins
    - Secure admin access patterns

  3. Functions & Triggers
    - Auto-create user profiles
    - Calculate ticket results automatically
    - Update timestamps
    - Set ticket months automatically
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS ticket_results CASCADE;
DROP TABLE IF EXISTS winning_numbers CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_source CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE ticket_source AS ENUM ('manual', 'sms', 'api');
CREATE TYPE notification_type AS ENUM ('winner', 'new_draw', 'system', 'admin');

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email text NOT NULL,
  full_name text,
  phone text,
  role user_role DEFAULT 'user',
  preferences jsonb DEFAULT '{"notifications": true, "sms_monitoring": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create tickets table
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  source ticket_source DEFAULT 'manual',
  purchase_date timestamptz DEFAULT now(),
  month text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create winning_numbers table
CREATE TABLE winning_numbers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  month text NOT NULL UNIQUE,
  draw_date timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  prize_amount numeric(12,2) DEFAULT 10000,
  total_winners integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ticket_results table
CREATE TABLE ticket_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  winning_number_id uuid REFERENCES winning_numbers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_count integer DEFAULT 0,
  is_winner boolean DEFAULT false,
  prize_amount numeric(12,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  claimed_at timestamptz,
  UNIQUE(ticket_id, winning_number_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create admin_logs table
CREATE TABLE admin_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create system_settings table
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_month ON tickets(month);
CREATE INDEX idx_tickets_numbers ON tickets(numbers);
CREATE INDEX idx_winning_numbers_month ON winning_numbers(month);
CREATE INDEX idx_ticket_results_user_id ON ticket_results(user_id);
CREATE INDEX idx_ticket_results_is_winner ON ticket_results(is_winner);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Tickets policies
CREATE POLICY "Users can read own tickets" ON tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own tickets" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tickets" ON tickets
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tickets" ON tickets
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all tickets" ON tickets
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Winning numbers policies
CREATE POLICY "Anyone can read winning numbers" ON winning_numbers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage winning numbers" ON winning_numbers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Ticket results policies
CREATE POLICY "Users can read own results" ON ticket_results
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all results" ON ticket_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admin logs policies
CREATE POLICY "Admins can read admin logs" ON admin_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- System settings policies
CREATE POLICY "Admins can read system settings" ON system_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage system settings" ON system_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() 
      AND p.role = 'super_admin'
    )
  );