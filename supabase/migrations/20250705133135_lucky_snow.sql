/*
  # Fix ambiguous column reference and add system data

  1. System Settings
    - Insert default application settings
    - Configure system parameters
    
  2. Sample Data
    - Add sample winning number for current month
    - Create welcome notifications for existing users
    - Provide function for additional test data
    
  3. Bug Fixes
    - Fix ambiguous column reference in calculate_ticket_results_for_month function
*/

-- First, fix the ambiguous column reference in the existing function
CREATE OR REPLACE FUNCTION calculate_ticket_results_for_month(target_month text)
RETURNS void AS $$
DECLARE
  winning_record winning_numbers%ROWTYPE;
  ticket_record tickets%ROWTYPE;
  match_count integer;
  is_winner_result boolean;
BEGIN
  -- Get the winning number for the specified month
  SELECT * INTO winning_record 
  FROM winning_numbers 
  WHERE month = target_month;
  
  IF NOT FOUND THEN
    RAISE NOTICE 'No winning number found for month: %', target_month;
    RETURN;
  END IF;
  
  -- Delete existing results for this month to recalculate
  DELETE FROM ticket_results 
  WHERE winning_number_id = winning_record.id;
  
  -- Process each ticket for this month
  FOR ticket_record IN 
    SELECT * FROM tickets 
    WHERE month = target_month
  LOOP
    -- Calculate match count
    match_count := 0;
    FOR i IN 1..10 LOOP
      IF substring(ticket_record.numbers, i, 1) = substring(winning_record.numbers, i, 1) THEN
        match_count := match_count + 1;
      END IF;
    END LOOP;
    
    -- Determine if this is a winner (all 10 digits match)
    is_winner_result := (match_count = 10);
    
    -- Insert the result
    INSERT INTO ticket_results (
      ticket_id,
      winning_number_id,
      user_id,
      match_count,
      is_winner,
      prize_amount,
      calculated_at
    ) VALUES (
      ticket_record.id,
      winning_record.id,
      ticket_record.user_id,
      match_count,
      is_winner_result,
      CASE WHEN is_winner_result THEN winning_record.prize_amount ELSE 0 END,
      now()
    );
  END LOOP;
  
  -- Update the total winners count for this winning number
  -- Fix: Qualify the column reference to avoid ambiguity
  UPDATE winning_numbers 
  SET total_winners = (
    SELECT COUNT(*) 
    FROM ticket_results tr
    WHERE tr.winning_number_id = winning_record.id AND tr.is_winner = true
  )
  WHERE id = winning_record.id;
  
  RAISE NOTICE 'Calculated results for % tickets in month %', 
    (SELECT COUNT(*) FROM tickets WHERE month = target_month), 
    target_month;
END;
$$ LANGUAGE plpgsql;

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
('app_name', '"Lottery Checker"', 'Application name'),
('app_version', '"1.0.0"', 'Current application version'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('registration_enabled', 'true', 'Allow new user registrations'),
('sms_monitoring_enabled', 'true', 'Enable SMS ticket detection'),
('auto_notifications', 'true', 'Send automatic notifications to users'),
('max_tickets_per_user_per_month', '100', 'Maximum tickets per user per month'),
('default_prize_amount', '10000.00', 'Default prize amount for winners'),
('data_retention_days', '365', 'Days to retain user data'),
('admin_email', '"admin@lotteryapp.com"', 'Admin contact email'),
('support_email', '"support@lotteryapp.com"', 'Support contact email'),
('draw_day_of_month', '15', 'Day of month when draws occur'),
('notification_settings', '{"email": true, "push": true, "sms": false}', 'Default notification preferences'),
('analytics_enabled', 'true', 'Enable analytics tracking'),
('backup_frequency_hours', '24', 'Backup frequency in hours')
ON CONFLICT (key) DO NOTHING;

-- Create a sample winning number for current month (for demo purposes)
DO $$
DECLARE
  current_month text := to_char(CURRENT_DATE, 'YYYY-MM');
  sample_numbers text := '1234567890';
BEGIN
  -- Only insert if no winning number exists for current month
  IF NOT EXISTS (SELECT 1 FROM winning_numbers WHERE month = current_month) THEN
    INSERT INTO winning_numbers (
      numbers,
      month,
      draw_date,
      prize_amount,
      total_winners
    ) VALUES (
      sample_numbers,
      current_month,
      date_trunc('month', CURRENT_DATE) + INTERVAL '14 days',
      10000.00,
      0
    );
  END IF;
END $$;

-- Create system notification templates
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data
) 
SELECT 
  p.user_id,
  'system',
  'Welcome to Lottery Checker!',
  'Thank you for joining our lottery tracking system. Start by adding your first ticket!',
  '{"welcome": true, "version": "1.0.0"}'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.user_id = p.user_id 
  AND n.type = 'system' 
  AND n.data->>'welcome' = 'true'
);

-- Function to create sample data for testing (call manually if needed)
CREATE OR REPLACE FUNCTION create_sample_data()
RETURNS void AS $$
DECLARE
  sample_user_id uuid;
  sample_ticket_id uuid;
  last_month text := to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM');
BEGIN
  -- This function can be called to create sample data for testing
  -- It's not executed automatically to avoid cluttering production data
  
  RAISE NOTICE 'Sample data creation function is available but not executed automatically.';
  RAISE NOTICE 'Call create_sample_data() manually if you need test data.';
  
  -- Uncomment below to actually create sample data:
  /*
  -- Create sample user if auth allows
  -- Note: This would need to be done through Supabase Auth, not directly
  
  -- Create sample tickets for testing
  INSERT INTO tickets (user_id, numbers, month, source) VALUES
  (sample_user_id, '1234567890', last_month, 'manual'),
  (sample_user_id, '9876543210', last_month, 'sms'),
  (sample_user_id, '5555555555', to_char(CURRENT_DATE, 'YYYY-MM'), 'manual');
  */
END;
$$ LANGUAGE plpgsql;