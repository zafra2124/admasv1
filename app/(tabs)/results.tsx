import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Trophy, RefreshCw, Calendar, Target, Ticket } from 'lucide-react-native';
import { getWinningNumbers, getUserTickets, getCurrentUser } from '@/utils/database';

interface WinningNumber {
  id: string;
  numbers: string;
  draw_date: string;
  month: string;
  prize_amount: number;
}

interface TicketResult {
  id: string;
  numbers: string;
  isWinner: boolean;
  matchCount: number;
  purchaseDate: string;
  prizeAmount: number;
}

export default function ResultsScreen() {
  const [winningNumbers, setWinningNumbers] = useState<WinningNumber[]>([]);
  const [ticketResults, setTicketResults] = useState<TicketResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadResults();
    }, [])
  );

  const loadResults = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        const numbers = await getWinningNumbers();
        const tickets = await getUserTickets();
        
        setWinningNumbers(numbers);
        
        // Process tickets to get results
        const processedResults = tickets.map(ticket => ({
          id: ticket.id,
          numbers: ticket.numbers,
          purchaseDate: ticket.purchase_date,
          isWinner: ticket.ticket_results?.[0]?.is_winner || false,
          matchCount: ticket.ticket_results?.[0]?.match_count || 0,
          prizeAmount: ticket.ticket_results?.[0]?.prize_amount || 0,
        }));
        
        setTicketResults(processedResults);
        
        if (numbers.length > 0) {
          setSelectedMonth(numbers[0].month);
        }
      }
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
    setRefreshing(false);
  }, []);

  const getResultsForMonth = (month: string) => {
    const winningNumberForMonth = winningNumbers.find(w => w.month === month);
    if (!winningNumberForMonth) return [];

    return ticketResults.filter(ticket => {
      const ticketMonth = new Date(ticket.purchaseDate).toISOString().substring(0, 7);
      return ticketMonth === month;
    });
  };

  const formatTicketNumbers = (numbers: string): string => {
    return numbers.replace(/(\d{2})/g, '$1 ').trim();
  };

  const getMatchColor = (matchCount: number): string => {
    if (matchCount >= 10) return '#059669'; // Full match - green
    if (matchCount >= 7) return '#d97706';  // High match - orange
    if (matchCount >= 4) return '#2563eb';  // Medium match - blue
    return '#6b7280';                       // Low match - gray
  };

  const getUniqueMonths = () => {
    return [...new Set(winningNumbers.map(w => w.month))].sort().reverse();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Results</Text>
          <Text style={styles.subtitle}>Please sign in to view results</Text>
        </View>
      </View>
    );
  }

  const months = getUniqueMonths();
  const currentMonthResults = selectedMonth ? getResultsForMonth(selectedMonth) : [];
  const currentWinningNumber = winningNumbers.find(w => w.month === selectedMonth);

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>Check your lottery results</Text>
      </View>

      {/* Refresh Button */}
      <View style={styles.refreshSection}>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={refreshing}>
          <RefreshCw size={20} color="#2563eb" />
          <Text style={styles.refreshButtonText}>Refresh Results</Text>
        </TouchableOpacity>
      </View>

      {/* Month Selection */}
      {months.length > 0 && (
        <View style={styles.monthSection}>
          <Text style={styles.sectionTitle}>Select Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
            {months.map((month) => (
              <TouchableOpacity
                key={month}
                style={[
                  styles.monthButton,
                  selectedMonth === month && styles.monthButtonActive
                ]}
                onPress={() => setSelectedMonth(month)}
              >
                <Text style={[
                  styles.monthButtonText,
                  selectedMonth === month && styles.monthButtonTextActive
                ]}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Current Month Winning Numbers */}
      {currentWinningNumber && (
        <View style={styles.winningNumbersCard}>
          <View style={styles.cardHeader}>
            <Trophy size={24} color="#d97706" />
            <Text style={styles.cardTitle}>Winning Numbers</Text>
          </View>
          <Text style={styles.winningNumbers}>{formatTicketNumbers(currentWinningNumber.numbers)}</Text>
          <View style={styles.drawInfo}>
            <Calendar size={16} color="#6b7280" />
            <Text style={styles.drawDate}>
              Draw Date: {new Date(currentWinningNumber.draw_date).toLocaleDateString()}
            </Text>
          </View>
          <Text style={styles.prizeAmount}>Prize: ${currentWinningNumber.prize_amount.toLocaleString()}</Text>
        </View>
      )}

      {/* Results Summary */}
      {currentMonthResults.length > 0 && (
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Your Results</Text>
          <View style={styles.summaryCards}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryNumber}>{currentMonthResults.length}</Text>
              <Text style={styles.summaryLabel}>Total Tickets</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#059669' }]}>
                {currentMonthResults.filter(r => r.isWinner).length}
              </Text>
              <Text style={styles.summaryLabel}>Winners</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryNumber, { color: '#d97706' }]}>
                {currentMonthResults.filter(r => r.matchCount >= 4 && !r.isWinner).length}
              </Text>
              <Text style={styles.summaryLabel}>Near Misses</Text>
            </View>
          </View>
        </View>
      )}

      {/* Detailed Results */}
      {currentMonthResults.length > 0 ? (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Ticket Details</Text>
          {currentMonthResults.map((result) => (
            <View key={result.id} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.ticketNumbers}>{formatTicketNumbers(result.numbers)}</Text>
                <View style={[
                  styles.resultBadge,
                  result.isWinner ? styles.winnerBadge : styles.loserBadge
                ]}>
                  <Text style={[
                    styles.resultBadgeText,
                    result.isWinner ? styles.winnerBadgeText : styles.loserBadgeText
                  ]}>
                    {result.isWinner ? `WINNER! $${result.prizeAmount}` : `${result.matchCount} matches`}
                  </Text>
                </View>
              </View>
              
              <View style={styles.resultMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.metaText}>
                    {new Date(result.purchaseDate).toLocaleDateString()}
                  </Text>
                </View>
                
                {result.matchCount > 0 && (
                  <View style={styles.metaItem}>
                    <Target size={16} color={getMatchColor(result.matchCount)} />
                    <Text style={[styles.metaText, { color: getMatchColor(result.matchCount) }]}>
                      {result.matchCount}/10 digits match
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : selectedMonth ? (
        <View style={styles.emptyState}>
          <Ticket size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No tickets for this month</Text>
          <Text style={styles.emptySubtext}>Add tickets to see results here</Text>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Trophy size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No results available</Text>
          <Text style={styles.emptySubtext}>Winning numbers will appear here once announced</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
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
  refreshSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563eb',
  },
  monthSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  monthScroll: {
    paddingHorizontal: 24,
  },
  monthButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  monthButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  monthButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
  },
  monthButtonTextActive: {
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  winningNumbersCard: {
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
  },
  winningNumbers: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#d97706',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  drawInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  drawDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  prizeAmount: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#059669',
    textAlign: 'center',
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
  },
  summaryCard: {
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
  summaryNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketNumbers: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    letterSpacing: 1,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  winnerBadge: {
    backgroundColor: '#dcfce7',
  },
  loserBadge: {
    backgroundColor: '#f3f4f6',
  },
  resultBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  winnerBadgeText: {
    color: '#059669',
  },
  loserBadgeText: {
    color: '#6b7280',
  },
  resultMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});