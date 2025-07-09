import { supabase } from './supabase';
export { getCurrentUser, ensureUserProfile } from './supabase';

// Ticket operations
export const createTicket = async (
  numbers: string,
  source: 'manual' | 'sms' | 'api' = 'manual',
  metadata: any = {}
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to add tickets');

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      user_id: user.id,
      numbers,
      source,
      metadata,
      month: new Date().toISOString().substring(0, 7), // Set current month
      purchase_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserTickets = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      ticket_results (
        match_count,
        is_winner,
        prize_amount,
        calculated_at
      )
    `)
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteTicket = async (ticketId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in to delete tickets');

  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', ticketId)
    .eq('user_id', user.id); // Ensure user can only delete their own tickets

  if (error) throw error;
};

// Winning numbers operations
export const createWinningNumber = async (
  numbers: string,
  month: string,
  drawDate: string,
  prizeAmount: number = 10000
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('winning_numbers')
    .insert({
      numbers,
      month,
      draw_date: drawDate,
      created_by: user.id,
      prize_amount: prizeAmount,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getWinningNumbers = async () => {
  const { data, error } = await supabase
    .from('winning_numbers')
    .select('*')
    .order('draw_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const deleteWinningNumber = async (id: string) => {
  const { error } = await supabase
    .from('winning_numbers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Ticket results operations
export const getUserTicketResults = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('ticket_results')
    .select(`
      *,
      tickets (
        numbers,
        purchase_date,
        source
      ),
      winning_numbers (
        numbers,
        month,
        draw_date
      )
    `)
    .eq('user_id', targetUserId)
    .order('calculated_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Notifications operations
export const getUserNotifications = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });
}
// Profile operations
export const getUserProfile = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', targetUserId)
    .single();

  if (error) throw error;
  return data;
};

export const updateUserProfile = async (updates: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Analytics operations
export const getUserDashboardData = async (userId?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  
  if (!targetUserId) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .rpc('get_user_dashboard_data', { user_uuid: targetUserId });

  if (error) throw error;
  return data;
};

export const getMonthlyAnalytics = async () => {
  const { data, error } = await supabase
    .from('monthly_analytics')
    .select('*')
    .order('month', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAdminDashboardStats = async () => {
  const { data, error } = await supabase
    .from('admin_dashboard_stats')
    .select('*')
    .single();

  if (error) throw error;
  return data;
};

export const getLeaderboard = async (limit: number = 10) => {
  const { data, error } = await supabase
    .rpc('get_leaderboard', { limit_count: limit });

  if (error) throw error;
  return data;
};

export const getSystemHealth = async () => {
  const { data, error } = await supabase
    .rpc('get_system_health');

  if (error) throw error;
  return data;
};

// Admin operations
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .order('total_wins', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAllTickets = async () => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles (
        email,
        full_name
      ),
      ticket_results (
        match_count,
        is_winner,
        prize_amount
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getAdminLogs = async (limit: number = 100) => {
  const { data, error } = await supabase
    .from('admin_logs')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

// System settings
export const getSystemSettings = async () => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('key');

  if (error) throw error;
  return data;
};

export const updateSystemSetting = async (key: string, value: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};