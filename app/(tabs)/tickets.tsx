import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Trash2, MessageSquare, Calendar, Ticket } from 'lucide-react-native';
import { createTicket, getUserTickets, deleteTicket as deleteTicketFromDB, getCurrentUser } from '@/utils/database';
import * as SMS from 'expo-sms';

interface TicketData {
  id: string;
  numbers: string;
  purchase_date: string;
  source: 'manual' | 'sms' | 'api';
  ticket_results?: Array<{
    match_count: number;
    is_winner: boolean;
    prize_amount: number;
  }>;
}

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [newTicketNumbers, setNewTicketNumbers] = useState('');
  const [isAddingTicket, setIsAddingTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserAndTickets();
    }, [])
  );

  const loadUserAndTickets = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const userTickets = await getUserTickets();
        setTickets(userTickets || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      Alert.alert('Error', 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const validateTicketNumbers = (numbers: string): boolean => {
    return /^\d{10}$/.test(numbers);
  };

  const addTicket = async () => {
    if (!validateTicketNumbers(newTicketNumbers)) {
      Alert.alert('Invalid Ticket', 'Please enter exactly 10 digits');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add tickets');
      return;
    }

    try {
      setLoading(true);
      await createTicket(newTicketNumbers, 'manual');
      
      setNewTicketNumbers('');
      setIsAddingTicket(false);
      await loadUserAndTickets();
      Alert.alert('Success', 'Ticket added successfully!');
    } catch (error) {
      console.error('Error adding ticket:', error);
      Alert.alert('Error', 'Failed to add ticket');
    } finally {
      setLoading(false);
    }
  };

  const removeTicket = async (ticketId: string) => {
    Alert.alert(
      'Delete Ticket',
      'Are you sure you want to delete this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteTicketFromDB(ticketId);
              await loadUserAndTickets();
              Alert.alert('Success', 'Ticket deleted successfully');
            } catch (error) {
              console.error('Error deleting ticket:', error);
              Alert.alert('Error', 'Failed to delete ticket');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const enableSMSMonitoring = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Feature Unavailable', 'SMS monitoring is only available on mobile devices');
      return;
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (isAvailable) {
      Alert.alert(
        'SMS Monitoring',
        'SMS monitoring would automatically detect lottery tickets from your messages. This feature requires additional permissions and setup.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('SMS Not Available', 'SMS functionality is not available on this device');
    }
  };

  const formatTicketNumbers = (numbers: string): string => {
    return numbers.replace(/(\d{2})/g, '$1 ').trim();
  };

  const getTicketStatus = (ticket: TicketData) => {
    if (ticket.ticket_results && ticket.ticket_results.length > 0) {
      const result = ticket.ticket_results[0];
      return {
        isWinner: result.is_winner,
        matchCount: result.match_count,
        prizeAmount: result.prize_amount
      };
    }
    return { isWinner: false, matchCount: 0, prizeAmount: 0 };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tickets</Text>
        <Text style={styles.subtitle}>Manage your lottery tickets</Text>
      </View>

      {/* Add New Ticket */}
      <View style={styles.addSection}>
        {!isAddingTicket ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingTicket(true)}>
            <Plus size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Add New Ticket</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Enter Ticket Numbers</Text>
            <TextInput
              style={styles.input}
              value={newTicketNumbers}
              onChangeText={setNewTicketNumbers}
              placeholder="Enter 10 digits"
              keyboardType="numeric"
              maxLength={10}
            />
            <Text style={styles.inputHelp}>Example: 1234567890</Text>
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.formButton, styles.cancelButton]} 
                onPress={() => {
                  setIsAddingTicket(false);
                  setNewTicketNumbers('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formButton} onPress={addTicket}>
                <Text style={styles.formButtonText}>Add Ticket</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* SMS Monitoring */}
      <View style={styles.smsSection}>
        <TouchableOpacity style={styles.smsButton} onPress={enableSMSMonitoring}>
          <MessageSquare size={20} color="#2563eb" />
          <Text style={styles.smsButtonText}>Enable SMS Monitoring</Text>
        </TouchableOpacity>
        <Text style={styles.smsHelp}>Automatically detect tickets from SMS messages</Text>
      </View>

      {/* Tickets List */}
      <View style={styles.ticketsSection}>
        <Text style={styles.sectionTitle}>Your Tickets ({tickets.length})</Text>
        {tickets.length > 0 ? (
          tickets.map((ticket) => {
            const status = getTicketStatus(ticket);
            return (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketNumbers}>{formatTicketNumbers(ticket.numbers)}</Text>
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => removeTicket(ticket.id)}
                  >
                    <Trash2 size={18} color="#dc2626" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.ticketMeta}>
                  <View style={styles.metaItem}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.metaText}>
                      {new Date(ticket.purchase_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.sourceBadge, ticket.source === 'sms' ? styles.smsBadge : styles.manualBadge]}>
                    <Text style={[styles.sourceText, ticket.source === 'sms' ? styles.smsText : styles.manualText]}>
                      {ticket.source === 'sms' ? 'SMS' : 'Manual'}
                    </Text>
                  </View>
                </View>

                {/* Result Status */}
                {status.matchCount > 0 && (
                  <View style={styles.resultSection}>
                    <View style={[styles.resultBadge, status.isWinner ? styles.winnerBadge : styles.matchBadge]}>
                      <Text style={[styles.resultText, status.isWinner ? styles.winnerText : styles.matchText]}>
                        {status.isWinner ? `🎉 WINNER! $${status.prizeAmount}` : `${status.matchCount} matches`}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ticket size={48} color="#9ca3af" />
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
  addSection: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  addButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  addForm: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputHelp: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  formButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  smsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  smsButton: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2563eb',
    gap: 8,
    marginBottom: 8,
  },
  smsButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563eb',
  },
  smsHelp: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
  ticketsSection: {
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
    marginBottom: 12,
  },
  ticketNumbers: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    letterSpacing: 1,
  },
  deleteButton: {
    padding: 8,
  },
  ticketMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smsBadge: {
    backgroundColor: '#dcfce7',
  },
  manualBadge: {
    backgroundColor: '#fef3c7',
  },
  sourceText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  smsText: {
    color: '#059669',
  },
  manualText: {
    color: '#d97706',
  },
  resultSection: {
    marginTop: 8,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  winnerBadge: {
    backgroundColor: '#dcfce7',
  },
  matchBadge: {
    backgroundColor: '#fef3c7',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  winnerText: {
    color: '#059669',
  },
  matchText: {
    color: '#d97706',
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
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
    textAlign: 'center',
  },
});