/*
  # Analytics Views and Functions

  1. Views
    - user_stats: User statistics and performance
    - monthly_analytics: Monthly lottery analytics
    - admin_dashboard_stats: Admin dashboard overview
    - ticket_source_analytics: Analytics by ticket source

  2. Functions
    - get_user_dashboard_data: Get user dashboard data
    - get_leaderboard: Get top winners
    - get_system_health: System health check
*/

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.full_name,
  COALESCE(ticket_counts.total_tickets, 0) as total_tickets,
  COALESCE(result_counts.total_wins, 0) as total_wins,
  COALESCE(result_counts.total_winnings, 0) as total_winnings,
  COALESCE(result_counts.near_misses, 0) as near_misses,
  ticket_counts.last_ticket_date,
  p.created_at as member_since
FROM profiles p
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as total_tickets,
    MAX(purchase_date) as last_ticket_date
  FROM tickets
  GROUP BY user_id
) ticket_counts ON p.user_id = ticket_counts.user_id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) FILTER (WHERE is_winner = true) as total_wins,
    SUM(prize_amount) as total_winnings,
    COUNT(*) FILTER (WHERE match_count >= 7 AND is_winner = false) as near_misses
  FROM ticket_results
  GROUP BY user_id
) result_counts ON p.user_id = result_counts.user_id;

-- Monthly analytics view
CREATE OR REPLACE VIEW monthly_analytics AS
SELECT 
  wn.month,
  wn.numbers as winning_numbers,
  wn.draw_date,
  wn.prize_amount,
  COALESCE(ticket_counts.total_tickets, 0) as total_tickets,
  COALESCE(result_counts.total_winners, 0) as total_winners,
  COALESCE(result_counts.near_misses, 0) as near_misses,
  CASE 
    WHEN ticket_counts.total_tickets > 0 
    THEN ROUND((result_counts.total_winners::numeric / ticket_counts.total_tickets::numeric) * 100, 2)
    ELSE 0
  END as win_rate_percentage,
  COALESCE(ticket_counts.unique_players, 0) as unique_players,
  COALESCE(result_counts.total_prizes_awarded, 0) as total_prizes_awarded
FROM winning_numbers wn
LEFT JOIN (
  SELECT 
    month,
    COUNT(*) as total_tickets,
    COUNT(DISTINCT user_id) as unique_players
  FROM tickets
  GROUP BY month
) ticket_counts ON wn.month = ticket_counts.month
LEFT JOIN (
  SELECT 
    wn.month,
    COUNT(*) FILTER (WHERE tr.is_winner = true) as total_winners,
    COUNT(*) FILTER (WHERE tr.match_count >= 7 AND tr.is_winner = false) as near_misses,
    SUM(tr.prize_amount) as total_prizes_awarded
  FROM ticket_results tr
  JOIN winning_numbers wn ON tr.winning_number_id = wn.id
  GROUP BY wn.month
) result_counts ON wn.month = result_counts.month
ORDER BY wn.draw_date DESC;

-- Admin dashboard stats view
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM tickets) as total_tickets,
  (SELECT COUNT(*) FROM winning_numbers) as total_draws,
  (SELECT COUNT(*) FROM ticket_results WHERE is_winner = true) as total_winners,
  (SELECT COALESCE(SUM(prize_amount), 0) FROM ticket_results WHERE is_winner = true) as total_prizes,
  (SELECT COUNT(*) FROM tickets WHERE created_at >= now() - interval '30 days') as tickets_last_30_days,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= now() - interval '30 days') as new_users_last_30_days,
  (SELECT COUNT(*) FROM notifications WHERE read_at IS NULL) as unread_notifications;

-- Ticket source analytics view
CREATE OR REPLACE VIEW ticket_source_analytics AS
SELECT 
  t.source,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE tr.is_winner = true) as winners,
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE tr.is_winner = true)::numeric / COUNT(*)::numeric) * 100, 2)
    ELSE 0
  END as win_rate_percentage,
  COUNT(DISTINCT t.user_id) as unique_users
FROM tickets t
LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
GROUP BY t.source;

-- Function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid uuid)
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_tickets', COALESCE(COUNT(t.*), 0),
    'total_wins', COALESCE(COUNT(tr.*) FILTER (WHERE tr.is_winner = true), 0),
    'total_winnings', COALESCE(SUM(tr.prize_amount), 0),
    'near_misses', COALESCE(COUNT(tr.*) FILTER (WHERE tr.match_count >= 7 AND tr.is_winner = false), 0),
    'recent_tickets', (
      SELECT json_agg(
        json_build_object(
          'id', t.id,
          'numbers', t.numbers,
          'purchase_date', t.purchase_date,
          'source', t.source,
          'is_winner', COALESCE(tr.is_winner, false),
          'match_count', COALESCE(tr.match_count, 0),
          'prize_amount', COALESCE(tr.prize_amount, 0)
        )
      )
      FROM tickets t
      LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
      WHERE t.user_id = user_uuid
      ORDER BY t.purchase_date DESC
      LIMIT 5
    ),
    'recent_notifications', (
      SELECT json_agg(
        json_build_object(
          'id', n.id,
          'type', n.type,
          'title', n.title,
          'message', n.message,
          'created_at', n.created_at,
          'read_at', n.read_at
        )
      )
      FROM notifications n
      WHERE n.user_id = user_uuid
      ORDER BY n.created_at DESC
      LIMIT 5
    )
  ) INTO result
  FROM tickets t
  LEFT JOIN ticket_results tr ON t.id = tr.ticket_id
  WHERE t.user_id = user_uuid;
  
  RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE(
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
    ROW_NUMBER() OVER (ORDER BY us.total_wins DESC, us.total_winnings DESC) as rank,
    us.user_id,
    us.full_name,
    us.email,
    us.total_wins,
    us.total_winnings,
    us.total_tickets,
    CASE 
      WHEN us.total_tickets > 0 
      THEN ROUND((us.total_wins::numeric / us.total_tickets::numeric) * 100, 2)
      ELSE 0
    END as win_rate
  FROM user_stats us
  WHERE us.total_tickets > 0
  ORDER BY us.total_wins DESC, us.total_winnings DESC
  LIMIT limit_count;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get system health
CREATE OR REPLACE FUNCTION get_system_health()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'database_status', 'healthy',
    'total_users', (SELECT COUNT(*) FROM profiles),
    'active_users_last_7_days', (
      SELECT COUNT(DISTINCT user_id) 
      FROM tickets 
      WHERE created_at >= now() - interval '7 days'
    ),
    'total_tickets_today', (
      SELECT COUNT(*) 
      FROM tickets 
      WHERE created_at >= current_date
    ),
    'pending_notifications', (
      SELECT COUNT(*) 
      FROM notifications 
      WHERE read_at IS NULL
    ),
    'last_draw_date', (
      SELECT MAX(draw_date) 
      FROM winning_numbers
    ),
    'system_uptime', extract(epoch from (now() - (
      SELECT MIN(created_at) 
      FROM profiles
    )))
  ) INTO result;
  
  RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;