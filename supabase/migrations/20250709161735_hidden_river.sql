/*
  # Functions and Triggers for Lottery System

  1. Functions
    - handle_new_user: Auto-create profile when user signs up
    - update_updated_at_column: Update timestamps
    - set_ticket_month: Auto-set month for tickets
    - calculate_ticket_results: Calculate results when winning numbers added
    - create_winner_notification: Notify winners

  2. Triggers
    - Auto-create profiles
    - Update timestamps
    - Set ticket months
    - Calculate results
    - Send notifications
*/

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to set ticket month automatically
CREATE OR REPLACE FUNCTION set_ticket_month()
RETURNS TRIGGER AS $$
BEGIN
  NEW.month = to_char(NEW.purchase_date, 'YYYY-MM');
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate ticket results
CREATE OR REPLACE FUNCTION calculate_ticket_results(winning_number_id_param uuid)
RETURNS void AS $$
DECLARE
  winning_record RECORD;
  ticket_record RECORD;
  match_count INTEGER;
  is_winner BOOLEAN;
  prize_amount NUMERIC;
BEGIN
  -- Get the winning number details
  SELECT * INTO winning_record 
  FROM winning_numbers 
  WHERE id = winning_number_id_param;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Process all tickets for this month
  FOR ticket_record IN 
    SELECT * FROM tickets 
    WHERE month = winning_record.month
  LOOP
    -- Calculate matches
    match_count := 0;
    FOR i IN 1..10 LOOP
      IF substring(ticket_record.numbers, i, 1) = substring(winning_record.numbers, i, 1) THEN
        match_count := match_count + 1;
      END IF;
    END LOOP;
    
    -- Determine if winner and prize amount
    is_winner := (match_count = 10);
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
      winning_number_id_param,
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
        'Your ticket ' || ticket_record.numbers || ' is a winner! Prize: $' || prize_amount,
        jsonb_build_object(
          'ticket_id', ticket_record.id,
          'winning_number_id', winning_number_id_param,
          'prize_amount', prize_amount,
          'ticket_numbers', ticket_record.numbers,
          'winning_numbers', winning_record.numbers
        )
      );
    END IF;
  END LOOP;
  
  -- Update total winners count
  UPDATE winning_numbers 
  SET total_winners = (
    SELECT COUNT(*) 
    FROM ticket_results 
    WHERE winning_number_id = winning_number_id_param AND is_winner = true
  )
  WHERE id = winning_number_id_param;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to trigger result calculation
CREATE OR REPLACE FUNCTION trigger_calculate_results()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_ticket_results(NEW.id);
  
  -- Create new draw notification for all users
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    DISTINCT user_id,
    'new_draw',
    'New Lottery Draw Results',
    'The results for ' || to_char(NEW.draw_date, 'Month YYYY') || ' are now available!',
    jsonb_build_object(
      'winning_number_id', NEW.id,
      'winning_numbers', NEW.numbers,
      'draw_date', NEW.draw_date,
      'month', NEW.month
    )
  FROM tickets 
  WHERE month = NEW.month;
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create triggers

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Triggers for updating updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_winning_numbers_updated_at
  BEFORE UPDATE ON winning_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set ticket month
CREATE TRIGGER set_ticket_month_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_ticket_month();

-- Trigger to calculate results when winning number is added
CREATE TRIGGER on_winning_number_inserted
  AFTER INSERT ON winning_numbers
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_results();