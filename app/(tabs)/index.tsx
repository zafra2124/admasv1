import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useState, useCallback } from 'react';
import { Plus, Zap, TrendingUp, Clock } from 'lucide-react-native';
import { getTickets, getWinningNumbers, compareTickets } from '@/utils/storage';
import { router } from 'expo-router';

interface TicketResult {
  id: string;
  numbers: string;
  isWinner: boolean;
  matchCount: number;
  purchaseDate: string;
}

export default function HomeScreen() {
  const [recentTickets, setRecentTickets] = useState<TicketResult[]>([]);
  const [stats, setStats] = useState({
    totalTickets: 0,
    winningTickets: 0,
    pendingResults: 0,
  });
  const [latestWinningNumbers, setLatestWinningNumbers] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const tickets = await getTickets();
      const winningNumbers = await getWinningNumbers();
      const latestWinning = winningNumbers[0]?.numbers || '';
      
      setLatestWinningNumbers(latestWinning);

      const ticketResults = await compareTickets();
      const recent = ticketResults.slice(0, 3);
      
      setRecentTickets(recent);
      setStats({
        totalTickets: tickets.length,
        winningTickets: ticketResults.filter(t => t.isWinner).length,
        pendingResults: tickets.filter(t => !latestWinning).length,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addTicket = () => {
    router.push('/tickets');
  };

  const checkResults = () => {
    router.push('/results');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Lottery Checker</Text>
        <Text style={styles.subtitle}>Track your tickets and check results</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={addTicket}>
          <Plus size={24} color="#ffffff" />
          <Text style={styles.actionButtonText}>Add Ticket</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={checkResults}>
          <Zap size={24} color="#2563eb" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Check Results</Text>
        </TouchableOpacity>
      </View>

      {/* Latest Winning Numbers */}
      {latestWinningNumbers ? (
        <View style={styles.winningNumbersCard}>
          <Text style={styles.cardTitle}>Latest Winning Numbers</Text>
          <Text style={styles.winningNumbers}>{latestWinningNumbers}</Text>
        </View>
      ) : null}

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#059669" />
          <Text style={styles.statNumber}>{stats.totalTickets}</Text>
          <Text style={styles.statLabel}>Total Tickets</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={24} color="#d97706" />
          <Text style={styles.statNumber}>{stats.winningTickets}</Text>
          <Text style={styles.statLabel}>Winners</Text>
        </View>
        <View style={styles.statCard}>
          <Clock size={24} color="#6b7280" />
          <Text style={styles.statNumber}>{stats.pendingResults}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Recent Tickets */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        {recentTickets.length > 0 ? (
          recentTickets.map((ticket) => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNumbers}>{ticket.numbers}</Text>
                <View style={[styles.statusBadge, ticket.isWinner ? styles.winnerBadge : styles.loserBadge]}>
                  <Text style={[styles.statusText, ticket.isWinner ? styles.winnerText : styles.loserText]}>
                    {ticket.isWinner ? 'Winner!' : 'No Match'}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketDate}>{new Date(ticket.purchaseDate).toLocaleDateString()}</Text>
              {ticket.matchCount > 0 && !ticket.isWinner && (
                <Text style={styles.matchCount}>{ticket.matchCount} digits match</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tickets yet</Text>
            <Text style={styles.emptySubtext}>Add your first lottery ticket to get started</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  actionButtonTextSecondary: {
    color: '#2563eb',
  },
  winningNumbersCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 12,
  },
  winningNumbers: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#d97706',
    textAlign: 'center',
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  recentSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumbers: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  winnerBadge: {
    backgroundColor: '#dcfce7',
  },
  loserBadge: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  winnerText: {
    color: '#059669',
  },
  loserText: {
    color: '#dc2626',
  },
  ticketDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  matchCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#d97706',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});