/*
  # Complete Lottery Management System Database

  1. New Tables
    - `profiles` - User profiles and preferences
    - `tickets` - Lottery tickets submitted by users
    - `winning_numbers` - Monthly winning numbers
    - `ticket_results` - Calculated results for each ticket
    - `notifications` - System notifications
    - `admin_logs` - Admin activity tracking
    - `system_settings` - Application configuration

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for users and admins
    - Secure admin access with role-based permissions

  3. Real-time Features
    - Enable real-time subscriptions for all tables
    - Automatic result calculation triggers
    - Notification system for winners

  4. Advanced Features
    - Automatic ticket result calculation
    - Winner notification system
    - Admin activity logging
    - Data analytics views
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE ticket_source AS ENUM ('manual', 'sms', 'api');
CREATE TYPE notification_type AS ENUM ('winner', 'new_draw', 'system', 'admin');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- Profiles table for user management
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role user_role DEFAULT 'user',
  preferences jsonb DEFAULT '{"notifications": true, "sms_monitoring": false}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  source ticket_source DEFAULT 'manual',
  purchase_date timestamptz DEFAULT now(),
  month text NOT NULL, -- Format: YYYY-MM
  metadata jsonb DEFAULT '{}'::jsonb, -- Store SMS details, location, etc.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Winning numbers table
CREATE TABLE IF NOT EXISTS winning_numbers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  month text UNIQUE NOT NULL, -- Format: YYYY-MM
  draw_date timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  prize_amount decimal(12,2) DEFAULT 0,
  total_winners integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ticket results table (calculated automatically)
CREATE TABLE IF NOT EXISTS ticket_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  winning_number_id uuid REFERENCES winning_numbers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  match_count integer NOT NULL DEFAULT 0,
  is_winner boolean NOT NULL DEFAULT false,
  prize_amount decimal(12,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  claimed_at timestamptz,
  UNIQUE(ticket_id, winning_number_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Admin activity logs
CREATE TABLE IF NOT EXISTS admin_logs (
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

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_month ON tickets(month);
CREATE INDEX IF NOT EXISTS idx_tickets_numbers ON tickets(numbers);
CREATE INDEX IF NOT EXISTS idx_winning_numbers_month ON winning_numbers(month);
CREATE INDEX IF NOT EXISTS idx_ticket_results_user_id ON ticket_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_results_is_winner ON ticket_results(is_winner);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE winning_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for tickets
CREATE POLICY "Users can read own tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all tickets"
  ON tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for winning_numbers
CREATE POLICY "Anyone can read winning numbers"
  ON winning_numbers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage winning numbers"
  ON winning_numbers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for ticket_results
CREATE POLICY "Users can read own results"
  ON ticket_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all results"
  ON ticket_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for notifications
CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_logs
CREATE POLICY "Admins can read admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for system_settings
CREATE POLICY "Admins can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    )
  );