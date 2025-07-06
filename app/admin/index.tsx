import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Plus, Calendar, Trophy, BarChart3, Users } from 'lucide-react-native';
import { getWinningNumbers, getTickets } from '@/utils/storage';

interface WinningNumber {
  id: string;
  numbers: string;
  drawDate: string;
  month: string;
}

export default function AdminScreen() {
  const [winningNumbers, setWinningNumbers] = useState<WinningNumber[]>([]);
  const [newWinningNumber, setNewWinningNumber] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isAddingNumber, setIsAddingNumber] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalWinners: 0,
    totalMonths: 0,
  });

  useEffect(() => {
    loadData();
    const currentMonth = new Date().toISOString().substring(0, 7);
    setSelectedMonth(currentMonth);
  }, []);

  const loadData = async () => {
    try {
      const numbers = await getWinningNumbers();
      const tickets = await getTickets();
      
      setWinningNumbers(numbers);
      setStats({
        totalTickets: tickets.length,
        totalWinners: 0, // This would be calculated based on comparison
        totalMonths: numbers.length,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const validateWinningNumber = (numbers: string): boolean => {
    return /^\d{10}$/.test(numbers);
  };

  const addWinningNumber = async () => {
    if (!validateWinningNumber(newWinningNumber)) {
      Alert.alert('Invalid Number', 'Please enter exactly 10 digits');
      return;
    }

    if (!selectedMonth) {
      Alert.alert('Invalid Date', 'Please select a month');
      return;
    }

    try {
      const response = await fetch('/api/winning-numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numbers: newWinningNumber,
          month: selectedMonth,
          drawDate: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setNewWinningNumber('');
        setIsAddingNumber(false);
        loadData();
        Alert.alert('Success', 'Winning number added successfully!');
      } else {
        Alert.alert('Error', 'Failed to add winning number');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add winning number');
    }
  };

  const deleteWinningNumber = async (id: string) => {
    Alert.alert(
      'Delete Winning Number',
      'Are you sure you want to delete this winning number?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`/api/winning-numbers?id=${id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                loadData();
                Alert.alert('Success', 'Winning number deleted');
              } else {
                Alert.alert('Error', 'Failed to delete winning number');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete winning number');
            }
          },
        },
      ]
    );
  };

  const formatNumbers = (numbers: string): string => {
    return numbers.replace(/(\d{2})/g, '$1 ').trim();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.subtitle}>Manage lottery winning numbers</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Users size={24} color="#2563eb" />
          <Text style={styles.statNumber}>{stats.totalTickets}</Text>
          <Text style={styles.statLabel}>Total Tickets</Text>
        </View>
        <View style={styles.statCard}>
          <Trophy size={24} color="#d97706" />
          <Text style={styles.statNumber}>{stats.totalWinners}</Text>
          <Text style={styles.statLabel}>Winners</Text>
        </View>
        <View style={styles.statCard}>
          <BarChart3 size={24} color="#059669" />
          <Text style={styles.statNumber}>{stats.totalMonths}</Text>
          <Text style={styles.statLabel}>Draws</Text>
        </View>
      </View>

      {/* Add New Winning Number */}
      <View style={styles.addSection}>
        {!isAddingNumber ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setIsAddingNumber(true)}>
            <Plus size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>Add Winning Number</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Winning Number</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Winning Numbers (10 digits)</Text>
              <TextInput
                style={styles.input}
                value={newWinningNumber}
                onChangeText={setNewWinningNumber}
                placeholder="Enter 10 digits"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Month</Text>
              <TextInput
                style={styles.input}
                value={selectedMonth}
                onChangeText={setSelectedMonth}
                placeholder="YYYY-MM"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity 
                style={[styles.formButton, styles.cancelButton]} 
                onPress={() => {
                  setIsAddingNumber(false);
                  setNewWinningNumber('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.formButton} onPress={addWinningNumber}>
                <Text style={styles.formButtonText}>Add Number</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Winning Numbers List */}
      <View style={styles.numbersSection}>
        <Text style={styles.sectionTitle}>Winning Numbers History</Text>
        {winningNumbers.length > 0 ? (
          winningNumbers.map((item) => (
            <View key={item.id} style={styles.numberCard}>
              <View style={styles.numberHeader}>
                <Text style={styles.winningNumbers}>{formatNumbers(item.numbers)}</Text>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteWinningNumber(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.numberMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.metaText}>
                    {new Date(item.drawDate).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.monthBadge}>
                  {new Date(item.month + '-01').toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No winning numbers yet</Text>
            <Text style={styles.emptySubtext}>Add the first winning number to get started</Text>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  addSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
  numbersSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
  },
  numberCard: {
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
  numberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  winningNumbers: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#d97706',
    letterSpacing: 1,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#dc2626',
  },
  numberMeta: {
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
  monthBadge: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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