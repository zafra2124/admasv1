/*
  # Database Functions and Triggers

  1. Functions
    - Calculate ticket results automatically
    - Send winner notifications
    - Log admin activities
    - Update statistics

  2. Triggers
    - Auto-calculate results when winning numbers are added
    - Auto-update timestamps
    - Auto-create notifications for winners
    - Log admin activities

  3. Real-time Setup
    - Enable real-time for all tables
    - Configure publication settings
*/

-- Function to calculate match count between two number strings
CREATE OR REPLACE FUNCTION calculate_match_count(ticket_numbers text, winning_numbers text)
RETURNS integer AS $$
DECLARE
  match_count integer := 0;
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    IF substring(ticket_numbers, i, 1) = substring(winning_numbers, i, 1) THEN
      match_count := match_count + 1;
    END IF;
  END LOOP;
  RETURN match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate all ticket results for a given month
CREATE OR REPLACE FUNCTION calculate_ticket_results_for_month(target_month text)
RETURNS void AS $$
DECLARE
  winning_record winning_numbers%ROWTYPE;
  ticket_record tickets%ROWTYPE;
  match_count integer;
  is_winner boolean;
  prize_amount decimal(12,2);
BEGIN
  -- Get the winning number for the month
  SELECT * INTO winning_record 
  FROM winning_numbers 
  WHERE month = target_month;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No winning number found for month %', target_month;
  END IF;
  
  -- Process all tickets for this month
  FOR ticket_record IN 
    SELECT * FROM tickets WHERE month = target_month
  LOOP
    -- Calculate match count
    match_count := calculate_match_count(ticket_record.numbers, winning_record.numbers);
    
    -- Determine if winner (full match)
    is_winner := (match_count = 10);
    
    -- Set prize amount (you can customize this logic)
    prize_amount := CASE 
      WHEN is_winner THEN winning_record.prize_amount
      ELSE 0
    END;
    
    -- Insert or update result
    INSERT INTO ticket_results (
      ticket_id, 
      winning_number_id, 
      user_id, 
      match_count, 
      is_winner, 
      prize_amount
    ) VALUES (
      ticket_record.id,
      winning_record.id,
      ticket_record.user_id,
      match_count,
      is_winner,
      prize_amount
    )
    ON CONFLICT (ticket_id, winning_number_id) 
    DO UPDATE SET
      match_count = EXCLUDED.match_count,
      is_winner = EXCLUDED.is_winner,
      prize_amount = EXCLUDED.prize_amount,
      calculated_at = now();
    
    -- Create winner notification
    IF is_winner THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        ticket_record.user_id,
        'winner',
        'Congratulations! You Won!',
        format('Your ticket %s is a winner! Prize: $%s', ticket_record.numbers, prize_amount),
        jsonb_build_object(
          'ticket_id', ticket_record.id,
          'winning_number_id', winning_record.id,
          'prize_amount', prize_amount,
          'match_count', match_count
        )
      );
    END IF;
  END LOOP;
  
  -- Update winner count in winning_numbers
  UPDATE winning_numbers 
  SET total_winners = (
    SELECT COUNT(*) 
    FROM ticket_results 
    WHERE winning_number_id = winning_record.id AND is_winner = true
  )
  WHERE id = winning_record.id;
END;
$$ LANGUAGE plpgsql;

-- Function to create admin log entry
CREATE OR REPLACE FUNCTION log_admin_activity(
  admin_user_id uuid,
  action_name text,
  resource_type_name text,
  resource_id_value text DEFAULT NULL,
  old_data_value jsonb DEFAULT NULL,
  new_data_value jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    old_data,
    new_data
  ) VALUES (
    admin_user_id,
    action_name,
    resource_type_name,
    resource_id_value,
    old_data_value,
    new_data_value
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to auto-calculate results when winning numbers are inserted
CREATE OR REPLACE FUNCTION trigger_calculate_results()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_ticket_results_for_month(NEW.month);
  
  -- Create notification for new draw
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    DISTINCT t.user_id,
    'new_draw',
    'New Lottery Results Available',
    format('Results for %s are now available. Check your tickets!', 
           to_char(to_date(NEW.month, 'YYYY-MM'), 'Month YYYY')),
    jsonb_build_object(
      'winning_number_id', NEW.id,
      'month', NEW.month,
      'winning_numbers', NEW.numbers
    )
  FROM tickets t
  WHERE t.month = NEW.month;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_winning_number_inserted ON winning_numbers;
CREATE TRIGGER on_winning_number_inserted
  AFTER INSERT ON winning_numbers
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_results();

-- Triggers for updating timestamps
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_winning_numbers_updated_at ON winning_numbers;
CREATE TRIGGER update_winning_numbers_updated_at
  BEFORE UPDATE ON winning_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-set month for tickets
CREATE OR REPLACE FUNCTION set_ticket_month()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.month IS NULL OR NEW.month = '' THEN
    NEW.month := to_char(NEW.purchase_date, 'YYYY-MM');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ticket_month_trigger ON tickets;
CREATE TRIGGER set_ticket_month_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_month();

-- Enable real-time for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE winning_numbers;
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_results;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE admin_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE system_settings;