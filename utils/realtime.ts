import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Custom hook for real-time tickets
export const useRealtimeTickets = (userId: string) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Initial fetch
      try {
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
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTickets(data || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }

      // Set up real-time subscription
      channel = supabase
        .channel('user_tickets')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            console.log('Ticket change:', payload);
            
            if (payload.eventType === 'INSERT') {
              // Fetch the complete ticket with results
              const { data } = await supabase
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
                .eq('id', payload.new.id)
                .single();
              
              if (data) {
                setTickets(prev => [data, ...prev]);
              }
            } else if (payload.eventType === 'UPDATE') {
              setTickets(prev => 
                prev.map(ticket => 
                  ticket.id === payload.new.id 
                    ? { ...ticket, ...payload.new }
                    : ticket
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setTickets(prev => 
                prev.filter(ticket => ticket.id !== payload.old.id)
              );
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ticket_results',
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            console.log('Ticket result change:', payload);
            
            // Update the ticket with new result data
            setTickets(prev => 
              prev.map(ticket => {
                if (ticket.id === payload.new?.ticket_id || ticket.id === payload.old?.ticket_id) {
                  return {
                    ...ticket,
                    ticket_results: payload.eventType === 'DELETE' 
                      ? [] 
                      : [payload.new]
                  };
                }
                return ticket;
              })
            );
          }
        )
        .subscribe();
    };

    if (userId) {
      setupSubscription();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { tickets, loading };
};

// Custom hook for real-time winning numbers
export const useRealtimeWinningNumbers = () => {
  const [winningNumbers, setWinningNumbers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Initial fetch
      try {
        const { data, error } = await supabase
          .from('winning_numbers')
          .select('*')
          .order('draw_date', { ascending: false });

        if (error) throw error;
        setWinningNumbers(data || []);
      } catch (error) {
        console.error('Error fetching winning numbers:', error);
      } finally {
        setLoading(false);
      }

      // Set up real-time subscription
      channel = supabase
        .channel('winning_numbers')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'winning_numbers',
          },
          (payload) => {
            console.log('Winning number change:', payload);
            
            if (payload.eventType === 'INSERT') {
              setWinningNumbers(prev => [payload.new, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setWinningNumbers(prev => 
                prev.map(wn => 
                  wn.id === payload.new.id ? payload.new : wn
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setWinningNumbers(prev => 
                prev.filter(wn => wn.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { winningNumbers, loading };
};

// Custom hook for real-time notifications
export const useRealtimeNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Initial fetch
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read_at).length || 0);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }

      // Set up real-time subscription
      channel = supabase
        .channel('user_notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('Notification change:', payload);
            
            if (payload.eventType === 'INSERT') {
              setNotifications(prev => [payload.new, ...prev]);
              if (!payload.new.read_at) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => 
                prev.map(notification => 
                  notification.id === payload.new.id ? payload.new : notification
                )
              );
              
              // Update unread count
              if (payload.old.read_at === null && payload.new.read_at !== null) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              } else if (payload.old.read_at !== null && payload.new.read_at === null) {
                setUnreadCount(prev => prev + 1);
              }
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => 
                prev.filter(notification => notification.id !== payload.old.id)
              );
              if (!payload.old.read_at) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe();
    };

    if (userId) {
      setupSubscription();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  return { notifications, unreadCount, loading };
};

// Custom hook for admin real-time data
export const useRealtimeAdminData = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let statsChannel: RealtimeChannel;
    let logsChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      try {
        // Fetch initial stats
        const { data: statsData, error: statsError } = await supabase
          .from('admin_dashboard_stats')
          .select('*')
          .single();

        if (statsError) throw statsError;
        setStats(statsData);

        // Fetch recent activity
        const { data: logsData, error: logsError } = await supabase
          .from('admin_logs')
          .select(`
            *,
            profiles (
              email,
              full_name
            )
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsError) throw logsError;
        setRecentActivity(logsData || []);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }

      // Subscribe to changes that affect stats
      statsChannel = supabase
        .channel('admin_stats')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
          },
          async () => {
            // Refresh stats when tickets change
            const { data } = await supabase
              .from('admin_dashboard_stats')
              .select('*')
              .single();
            if (data) setStats(data);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
          },
          async () => {
            // Refresh stats when users change
            const { data } = await supabase
              .from('admin_dashboard_stats')
              .select('*')
              .single();
            if (data) setStats(data);
          }
        )
        .subscribe();

      // Subscribe to admin logs
      logsChannel = supabase
        .channel('admin_logs')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_logs',
          },
          async (payload) => {
            // Fetch the complete log entry with profile data
            const { data } = await supabase
              .from('admin_logs')
              .select(`
                *,
                profiles (
                  email,
                  full_name
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (data) {
              setRecentActivity(prev => [data, ...prev.slice(0, 9)]);
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (statsChannel) supabase.removeChannel(statsChannel);
      if (logsChannel) supabase.removeChannel(logsChannel);
    };
  }, []);

  return { stats, recentActivity, loading };
};

// Utility function to create a real-time subscription
export const createRealtimeSubscription = (
  channelName: string,
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) => {
  const channel = supabase.channel(channelName);
  
  const subscription = channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table,
      ...(filter && { filter }),
    },
    callback || ((payload) => console.log('Real-time update:', payload))
  );

  subscription.subscribe();

  return () => supabase.removeChannel(channel);
};