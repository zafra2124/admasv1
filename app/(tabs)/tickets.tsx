import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Trash2, MessageSquare, Calendar } from 'lucide-react-native';
import { saveTicket, getTickets, deleteTicket } from '@/utils/storage';
import * as SMS from 'expo-sms';

interface Ticket {
  id: string;
  numbers: string;
  purchaseDate: string;
  source: 'manual' | 'sms';
}

export default function TicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newTicketNumbers, setNewTicketNumbers] = useState('');
  const [isAddingTicket, setIsAddingTicket] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTickets();
    }, [])
  );

  const loadTickets = async () => {
    try {
      const savedTickets = await getTickets();
      setTickets(savedTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
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

    try {
      const ticket: Ticket = {
        id: Date.now().toString(),
        numbers: newTicketNumbers,
        purchaseDate: new Date().toISOString(),
        source: 'manual',
      };

      await saveTicket(ticket);
      setNewTicketNumbers('');
      setIsAddingTicket(false);
      loadTickets();
      Alert.alert('Success', 'Ticket added successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to add ticket');
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
              await deleteTicket(ticketId);
              loadTickets();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ticket');
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
          tickets.map((ticket) => (
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
                    {new Date(ticket.purchaseDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[styles.sourceBadge, ticket.source === 'sms' ? styles.smsBadge : styles.manualBadge]}>
                  <Text style={styles.sourceText}>
                    {ticket.source === 'sms' ? 'SMS' : 'Manual'}
                  </Text>
                </View>
              </View>
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
    color: '#059669',
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