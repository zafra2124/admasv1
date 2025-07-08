-- Fix all database issues and ensure proper functionality

-- First, let's ensure all required tables exist with proper structure
-- Drop and recreate problematic policies to fix recursion issues

-- Fix profiles table policies (remove recursion)
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create non-recursive policies for profiles
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

-- Simple admin policy without recursion
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Ensure tickets table exists and has proper policies
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  source ticket_source DEFAULT 'manual',
  purchase_date timestamptz DEFAULT now(),
  month text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing ticket policies
DROP POLICY IF EXISTS "Users can read own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can delete own tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can read all tickets" ON tickets;

-- Create proper ticket policies
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

-- Simple admin policy for tickets
CREATE POLICY "Admins can manage all tickets"
  ON tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Ensure winning_numbers table exists
CREATE TABLE IF NOT EXISTS winning_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numbers text NOT NULL CHECK (length(numbers) = 10 AND numbers ~ '^[0-9]+$'),
  month text UNIQUE NOT NULL,
  draw_date timestamptz NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  prize_amount decimal(12,2) DEFAULT 0,
  total_winners integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on winning_numbers
ALTER TABLE winning_numbers ENABLE ROW LEVEL SECURITY;

-- Drop existing winning_numbers policies
DROP POLICY IF EXISTS "Anyone can read winning numbers" ON winning_numbers;
DROP POLICY IF EXISTS "Admins can manage winning numbers" ON winning_numbers;

-- Create winning_numbers policies
CREATE POLICY "Anyone can read winning numbers"
  ON winning_numbers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage winning numbers"
  ON winning_numbers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Ensure ticket_results table exists
CREATE TABLE IF NOT EXISTS ticket_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Enable RLS on ticket_results
ALTER TABLE ticket_results ENABLE ROW LEVEL SECURITY;

-- Drop existing ticket_results policies
DROP POLICY IF EXISTS "Users can read own results" ON ticket_results;
DROP POLICY IF EXISTS "Admins can read all results" ON ticket_results;

-- Create ticket_results policies
CREATE POLICY "Users can read own results"
  ON ticket_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all results"
  ON ticket_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing notification policies
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;

-- Create notification policies
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
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
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

-- Fix the trigger function to auto-set month for tickets
CREATE OR REPLACE FUNCTION set_ticket_month()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.month IS NULL OR NEW.month = '' THEN
    NEW.month := to_char(COALESCE(NEW.purchase_date, now()), 'YYYY-MM');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set month
DROP TRIGGER IF EXISTS set_ticket_month_trigger ON tickets;
CREATE TRIGGER set_ticket_month_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_month();

-- Ensure the handle_new_user function works properly
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add a sample winning number for current month if none exists
DO $$
DECLARE
  current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM winning_numbers WHERE month = current_month) THEN
    INSERT INTO winning_numbers (
      numbers,
      month,
      draw_date,
      prize_amount,
      total_winners
    ) VALUES (
      '1234567890',
      current_month,
      date_trunc('month', CURRENT_DATE) + INTERVAL '14 days',
      10000.00,
      0
    );
  END IF;
END $$;