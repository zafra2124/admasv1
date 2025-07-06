import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState } from 'react';
import { Bell, Shield, Trash2, Download, Globe, HelpCircle } from 'lucide-react-native';
import { clearAllData } from '@/utils/storage';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
    Alert.alert(
      'Notifications',
      `Notifications ${!notificationsEnabled ? 'enabled' : 'disabled'}`,
      [{ text: 'OK' }]
    );
  };

  const exportData = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Export Data', 'Data export functionality will be available in the mobile app');
    } else {
      Alert.alert('Export Data', 'Your ticket data will be exported to a file');
    }
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your tickets and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const openAdmin = () => {
    if (Platform.OS === 'android') {
      router.push('/admin');
    } else {
      Alert.alert('Admin Panel', 'Admin panel is only available on web version');
    }
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'Lottery Checker App\n\n' +
      '• Add tickets manually or via SMS\n' +
      '• Check results monthly\n' +
      '• Track your winning history\n' +
      '• Admin panel for managing results\n\n' +
      'For support, contact: support@lotteryapp.com',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    destructive = false 
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, destructive && styles.destructiveIcon]}>
          {icon}
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement && (
        <View style={styles.settingRight}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your app preferences</Text>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={<Bell size={20} color="#2563eb" />}
          title="Push Notifications"
          subtitle="Get notified about new results"
          onPress={toggleNotifications}
          rightElement={
            <View style={[styles.toggle, notificationsEnabled && styles.toggleActive]}>
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
            </View>
          }
        />
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <SettingItem
          icon={<Download size={20} color="#2563eb" />}
          title="Export Data"
          subtitle="Download your ticket data"
          onPress={exportData}
        />
        <SettingItem
          icon={<Trash2 size={20} color="#dc2626" />}
          title="Clear All Data"
          subtitle="Permanently delete all tickets"
          onPress={clearData}
          destructive={true}
        />
      </View>

      {/* Admin */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Administration</Text>
        <SettingItem
          icon={<Globe size={20} color="#2563eb" />}
          title="Admin Panel"
          subtitle="Manage winning numbers (Web only)"
          onPress={openAdmin}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <SettingItem
          icon={<HelpCircle size={20} color="#2563eb" />}
          title="Help & Support"
          subtitle="Get help and contact support"
          onPress={showHelp}
        />
      </View>

      {/* App Info */}
      <View style={styles.infoSection}>
        <Text style={styles.appName}>Lottery Checker</Text>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.copyright}>© 2025 Lottery Checker App</Text>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  settingItem: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  destructiveIcon: {
    backgroundColor: '#fef2f2',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 2,
  },
  destructiveText: {
    color: '#dc2626',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
  },
  settingRight: {
    marginLeft: 16,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#2563eb',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  infoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  appName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9ca3af',
  },
});