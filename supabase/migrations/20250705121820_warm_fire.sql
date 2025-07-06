/*
  # Analytics Views and Helper Functions

  1. Views
    - User statistics
    - Monthly analytics
    - Admin dashboard data
    - Winner statistics

  2. Helper Functions
    - Get user stats
    - Get monthly analytics
    - Get system health
*/

-- View for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.full_name,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN tr.is_winner THEN 1 END) as total_wins,
  COALESCE(SUM(tr.prize_amount), 0) as total_winnings,
  COUNT(CASE WHEN tr.match_count >= 7 THEN 1 END) as near_misses,
  MAX(t.created_at) as last_ticket_date,
  p.created_at as member_since
FROM profiles p
LEFT JOIN tickets t ON p.user_id = t.user_id
LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
GROUP BY p.id, p.user_id, p.email, p.full_name, p.created_at;

-- View for monthly analytics
CREATE OR REPLACE VIEW monthly_analytics AS
SELECT 
  wn.month,
  wn.numbers as winning_numbers,
  wn.draw_date,
  wn.prize_amount,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN tr.is_winner THEN 1 END) as total_winners,
  COUNT(CASE WHEN tr.match_count >= 7 AND NOT tr.is_winner THEN 1 END) as near_misses,
  ROUND(
    CASE 
      WHEN COUNT(t.id) > 0 
      THEN (COUNT(CASE WHEN tr.is_winner THEN 1 END)::decimal / COUNT(t.id)) * 100 
      ELSE 0 
    END, 2
  ) as win_rate_percentage,
  COUNT(DISTINCT t.user_id) as unique_players,
  COALESCE(SUM(tr.prize_amount), 0) as total_prizes_awarded
FROM winning_numbers wn
LEFT JOIN tickets t ON wn.month = t.month
LEFT JOIN ticket_results tr ON t.id = tr.ticket_id AND wn.id = tr.winning_number_id
GROUP BY wn.id, wn.month, wn.numbers, wn.draw_date, wn.prize_amount
ORDER BY wn.month DESC;

-- View for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'user') as total_users,
  (SELECT COUNT(*) FROM tickets) as total_tickets,
  (SELECT COUNT(*) FROM winning_numbers) as total_draws,
  (SELECT COUNT(*) FROM ticket_results WHERE is_winner = true) as total_winners,
  (SELECT COALESCE(SUM(prize_amount), 0) FROM ticket_results WHERE is_winner = true) as total_prizes,
  (SELECT COUNT(*) FROM tickets WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as tickets_last_30_days,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_last_30_days,
  (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) as unread_notifications;

-- View for ticket source analytics
CREATE OR REPLACE VIEW ticket_source_analytics AS
SELECT 
  source,
  COUNT(*) as total_tickets,
  COUNT(CASE WHEN tr.is_winner THEN 1 END) as winners,
  ROUND(
    CASE 
      WHEN COUNT(*) > 0 
      THEN (COUNT(CASE WHEN tr.is_winner THEN 1 END)::decimal / COUNT(*)) * 100 
      ELSE 0 
    END, 2
  ) as win_rate_percentage,
  COUNT(DISTINCT t.user_id) as unique_users
FROM tickets t
LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
GROUP BY source;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_tickets', COALESCE(COUNT(t.id), 0),
    'total_wins', COALESCE(COUNT(CASE WHEN tr.is_winner THEN 1 END), 0),
    'total_winnings', COALESCE(SUM(tr.prize_amount), 0),
    'near_misses', COALESCE(COUNT(CASE WHEN tr.match_count >= 7 AND NOT tr.is_winner THEN 1 END), 0),
    'tickets_this_month', COALESCE(COUNT(CASE WHEN t.month = to_char(CURRENT_DATE, 'YYYY-MM') THEN 1 END), 0),
    'last_ticket_date', MAX(t.created_at),
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications 
      WHERE user_id = user_uuid AND read_at IS NULL
    ),
    'recent_results', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'ticket_id', tr.ticket_id,
          'numbers', t.numbers,
          'match_count', tr.match_count,
          'is_winner', tr.is_winner,
          'prize_amount', tr.prize_amount,
          'calculated_at', tr.calculated_at
        )
      )
      FROM ticket_results tr
      JOIN tickets t ON tr.ticket_id = t.id
      WHERE tr.user_id = user_uuid
      ORDER BY tr.calculated_at DESC
      LIMIT 5
    )
  ) INTO result
  FROM tickets t
  LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
  WHERE t.user_id = user_uuid;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function to get system health status
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'database_status', 'healthy',
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_today', (
      SELECT COUNT(DISTINCT user_id) 
      FROM tickets 
      WHERE created_at >= CURRENT_DATE
    ),
    'pending_calculations', (
      SELECT COUNT(*) 
      FROM tickets t
      LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
      WHERE tr.id IS NULL AND EXISTS (
        SELECT 1 FROM winning_numbers wn WHERE wn.month = t.month
      )
    ),
    'unprocessed_notifications', (
      SELECT COUNT(*) 
      FROM notifications 
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
      AND read_at IS NULL
    ),
    'last_draw_date', (
      SELECT MAX(draw_date) FROM winning_numbers
    ),
    'next_expected_draw', (
      SELECT date_trunc('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '14 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  full_name text,
  email text,
  total_wins bigint,
  total_winnings numeric,
  total_tickets bigint,
  win_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY COUNT(CASE WHEN tr.is_winner THEN 1 END) DESC, SUM(tr.prize_amount) DESC) as rank,
    p.user_id,
    p.full_name,
    p.email,
    COUNT(CASE WHEN tr.is_winner THEN 1 END) as total_wins,
    COALESCE(SUM(tr.prize_amount), 0) as total_winnings,
    COUNT(t.id) as total_tickets,
    ROUND(
      CASE 
        WHEN COUNT(t.id) > 0 
        THEN (COUNT(CASE WHEN tr.is_winner THEN 1 END)::decimal / COUNT(t.id)) * 100 
        ELSE 0 
      END, 2
    ) as win_rate
  FROM profiles p
  LEFT JOIN tickets t ON p.user_id = t.user_id
  LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
  WHERE p.role = 'user'
  GROUP BY p.user_id, p.full_name, p.email
  HAVING COUNT(t.id) > 0
  ORDER BY total_wins DESC, total_winnings DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;