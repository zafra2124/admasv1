/*
  # Initial Data Setup

  1. System Settings
    - Default application configuration
    - Feature flags and limits

  2. Sample Data (for development)
    - Demo admin user setup instructions
    - Sample winning numbers
*/

-- Insert default system settings
INSERT INTO system_settings (key, value, description) VALUES
  ('app_name', '"Lottery Checker"', 'Application name'),
  ('max_tickets_per_user', '100', 'Maximum tickets per user per month'),
  ('auto_notifications', 'true', 'Enable automatic notifications'),
  ('sms_monitoring', 'false', 'Enable SMS monitoring feature'),
  ('data_retention_days', '365', 'Days to retain user data'),
  ('maintenance_mode', 'false', 'Enable maintenance mode'),
  ('prize_amounts', '{"full_match": 10000, "partial_match": 0}', 'Prize configuration'),
  ('notification_settings', '{"winner": true, "new_draw": true, "system": true}', 'Notification preferences');

-- Note: To create an admin user, you need to:
-- 1. Sign up normally through the app
-- 2. Then run this SQL to make them admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- Sample winning number for testing (January 2025)
-- Uncomment the line below if you want sample data
-- INSERT INTO winning_numbers (numbers, month, draw_date, prize_amount) 
-- VALUES ('1234567890', '2025-01', '2025-01-15 20:00:00+00', 10000);