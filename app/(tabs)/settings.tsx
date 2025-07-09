import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { Bell, User, Shield, Trash2, Download, CircleHelp as HelpCircle, LogOut, Eye, EyeOff } from 'lucide-react-native';
import { supabase, signOut, getCurrentUser } from '@/utils/supabase';
import { getUserProfile, updateUserProfile, ensureUserProfile } from '@/utils/supabase';
import { router } from 'expo-router';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  preferences: any;
}

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smsMonitoring, setSmsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Ensure user profile exists
        await ensureUserProfile();
        
        const userProfile = await getUserProfile();
        setProfile(userProfile);
        
        // Load preferences
        if (userProfile?.preferences) {
          setNotificationsEnabled(userProfile.preferences.notifications ?? true);
          setSmsMonitoring(userProfile.preferences.sms_monitoring ?? false);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: any) => {
    try {
      if (profile) {
        await updateUserProfile({
          preferences: {
            ...profile.preferences,
            ...newPreferences
          }
        });
        
        setProfile(prev => prev ? {
          ...prev,
          preferences: { ...prev.preferences, ...newPreferences }
        } : null);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update preferences');
    }
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await updatePreferences({ notifications: newValue });
    
    Alert.alert(
      'Notifications',
      `Notifications ${newValue ? 'enabled' : 'disabled'}`,
      [{ text: 'OK' }]
    );
  };

  const toggleSmsMonitoring = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Feature Unavailable', 'SMS monitoring is only available on mobile devices');
      return;
    }

    const newValue = !smsMonitoring;
    setSmsMonitoring(newValue);
    await updatePreferences({ sms_monitoring: newValue });
    
    Alert.alert(
      'SMS Monitoring',
      `SMS monitoring ${newValue ? 'enabled' : 'disabled'}. ${newValue ? 'The app will now scan your SMS messages for lottery tickets.' : ''}`,
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
              // Clear user's tickets from database
              const { error } = await supabase
                .from('tickets')
                .delete()
                .eq('user_id', user?.id);

              if (error) throw error;
              
              Alert.alert('Success', 'All your data has been cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigate to login screen or handle sign out
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'Lottery Checker App\n\n' +
      '• Add tickets manually or via SMS\n' +
      '• Check results automatically\n' +
      '• Get notified about wins\n' +
      '• Track your winning history\n\n' +
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your preferences</Text>
      </View>

      {/* Profile Section */}
      {profile && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <User size={24} color="#2563eb" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile.full_name || 'User'}
              </Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingItem
          icon={<Bell size={20} color="#2563eb" />}
          title="Push Notifications"
          subtitle="Get notified about lottery results"
          onPress={toggleNotifications}
          rightElement={
            <View style={[styles.toggle, notificationsEnabled && styles.toggleActive]}>
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
            </View>
          }
        />
        <SettingItem
          icon={<Shield size={20} color="#2563eb" />}
          title="SMS Monitoring"
          subtitle="Auto-detect tickets from SMS messages"
          onPress={toggleSmsMonitoring}
          rightElement={
            <View style={[styles.toggle, smsMonitoring && styles.toggleActive]}>
              <View style={[styles.toggleThumb, smsMonitoring && styles.toggleThumbActive]} />
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
          subtitle="Permanently delete all your tickets"
          onPress={clearData}
          destructive={true}
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

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingItem
          icon={<LogOut size={20} color="#dc2626" />}
          title="Sign Out"
          subtitle="Sign out of your account"
          onPress={handleSignOut}
          destructive={true}
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
  profileCard: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6b7280',
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