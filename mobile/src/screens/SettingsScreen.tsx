import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { testSupabaseConnection } from '../lib/supabase';

export const SettingsScreen: React.FC = () => {
  const profile = useWinterStore(s => s.profile);
  const updateProfile = useWinterStore(s => s.updateProfile);
  const triggerSync = useWinterStore(s => s.triggerSync);
  const isSyncing = useWinterStore(s => s.isSyncing);
  const syncMessage = useWinterStore(s => s.syncMessage);
  const resetToSampleData = useWinterStore(s => s.resetToSampleData);

  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    const result = await testSupabaseConnection();
    setConnectionStatus(result.message);
    setTestingConnection(false);
  };

  const handleSyncNow = async () => {
    await triggerSync();
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset to Sample Data',
      'This will replace your current data with sample demonstration data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetToSampleData,
        },
      ]
    );
  };

  // Arc day calculation
  const start = new Date(profile.startDate).getTime();
  const now = Date.now();
  const arcDay = Math.min(
    profile.arcLength,
    Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1)
  );
  const pct = Math.round((arcDay / profile.arcLength) * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings & Cloud Sync</Text>
      <Text style={styles.subheading}>
        Manage your arc settings and Supabase database connection
      </Text>

      {/* Arc Overview */}
      <Card elevated style={styles.arcCard}>
        <Text style={styles.sectionLabel}>YOUR 90-DAY ARC</Text>
        <View style={styles.arcRow}>
          <View>
            <Text style={styles.arcDay}>Day {arcDay} / {profile.arcLength}</Text>
            <Text style={styles.arcDate}>Started: {profile.startDate}</Text>
          </View>
          <View style={styles.arcBadge}>
            <Text style={styles.arcPct}>{pct}%</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
        </View>

        <View style={styles.miniStats}>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatVal}>🔥 {profile.streak}d</Text>
            <Text style={styles.miniStatLabel}>Streak</Text>
          </View>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatVal}>⚡ {profile.totalXp}</Text>
            <Text style={styles.miniStatLabel}>Total XP</Text>
          </View>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatVal}>💎 {profile.spendableXp}</Text>
            <Text style={styles.miniStatLabel}>Spendable XP</Text>
          </View>
          <View style={styles.miniStatItem}>
            <Text style={styles.miniStatVal}>🛡️ {profile.freezesLeft}</Text>
            <Text style={styles.miniStatLabel}>Freeze Days</Text>
          </View>
        </View>
      </Card>

      {/* Supabase Cloud Sync */}
      <Card style={styles.syncCard}>
        <View style={styles.syncHeader}>
          <View style={styles.syncDot} />
          <Text style={styles.syncTitle}>Supabase Cloud Database</Text>
        </View>
        <Text style={styles.syncUrl}>
          Project: nxuwssqexezkbynulmlk.supabase.co
        </Text>

        {/* Status message */}
        {connectionStatus && (
          <View style={[
            styles.statusBox,
            connectionStatus.startsWith('Connect') ? styles.statusBoxGood : styles.statusBoxWarn,
          ]}>
            <Text style={[
              styles.statusText,
              connectionStatus.startsWith('Connect') ? styles.statusTextGood : styles.statusTextWarn,
            ]}>
              {connectionStatus}
            </Text>
          </View>
        )}

        {syncMessage ? (
          <View style={[
            styles.statusBox,
            syncMessage.includes('Successfully') ? styles.statusBoxGood : styles.statusBoxWarn,
          ]}>
            <Text style={[
              styles.statusText,
              syncMessage.includes('Successfully') ? styles.statusTextGood : styles.statusTextWarn,
            ]}>
              {syncMessage}
            </Text>
          </View>
        ) : null}

        <View style={styles.syncButtonsRow}>
          <Button
            title={testingConnection ? 'Testing...' : 'Test Connection'}
            onPress={handleTestConnection}
            variant="secondary"
            size="sm"
            loading={testingConnection}
            style={{ flex: 1 }}
          />
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Now ☁️'}
            onPress={handleSyncNow}
            variant="primary"
            size="sm"
            loading={isSyncing}
            style={{ flex: 1 }}
          />
        </View>

        <Text style={styles.syncNote}>
          ⚠️ Before syncing: Run{' '}
          <Text style={styles.codeText}>supabase/schema.sql</Text> in your Supabase SQL editor to create all tables.
        </Text>
      </Card>

      {/* Profile Settings */}
      <Card style={styles.settingSection}>
        <Text style={styles.sectionLabel}>APP PREFERENCES</Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => updateProfile({ soundEnabled: !profile.soundEnabled })}
        >
          <View>
            <Text style={styles.settingTitle}>Sound Effects</Text>
            <Text style={styles.settingDesc}>Play sounds on task completion</Text>
          </View>
          <View style={[styles.toggle, profile.soundEnabled && styles.toggleOn]}>
            <View style={[styles.toggleThumb, profile.soundEnabled && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => updateProfile({ notificationsEnabled: !profile.notificationsEnabled })}
        >
          <View>
            <Text style={styles.settingTitle}>Notifications</Text>
            <Text style={styles.settingDesc}>Task reminders and streak alerts</Text>
          </View>
          <View style={[styles.toggle, profile.notificationsEnabled && styles.toggleOn]}>
            <View style={[styles.toggleThumb, profile.notificationsEnabled && styles.toggleThumbOn]} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => updateProfile({ theme: profile.theme === 'dark' ? 'light' : 'dark' })}
        >
          <View>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingDesc}>Currently: {profile.theme}</Text>
          </View>
          <View style={styles.themeToggle}>
            <Text style={styles.themeToggleText}>
              {profile.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Danger Zone */}
      <Card style={styles.dangerCard}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>

        <Button
          title="Reset to Sample Data"
          onPress={handleResetData}
          variant="danger"
          style={styles.dangerBtn}
        />

        <Text style={styles.dangerHint}>
          This replaces your data with demonstration content. Cannot be undone.
        </Text>
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>WinterArc Mobile v1.0</Text>
        <Text style={styles.appInfoText}>Built with React Native + Expo + Supabase</Text>
        <Text style={styles.appInfoText}>90 Days. No Excuses. One Direction.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  subheading: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  arcCard: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.iceBlue,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  arcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  arcDay: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  arcDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  arcBadge: {
    backgroundColor: colors.iceBlueSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.iceBlue,
  },
  arcPct: {
    color: colors.iceBlue,
    fontWeight: '900',
    fontSize: 14,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.mintSuccess,
    borderRadius: 4,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatItem: {
    alignItems: 'center',
  },
  miniStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  miniStatLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  syncCard: {
    marginBottom: spacing.lg,
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mintSuccess,
    marginRight: 8,
  },
  syncTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  syncUrl: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontFamily: 'monospace',
  },
  statusBox: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  statusBoxGood: {
    backgroundColor: colors.mintSubtle,
    borderColor: 'rgba(0, 217, 127, 0.3)',
  },
  statusBoxWarn: {
    backgroundColor: colors.amberSubtle,
    borderColor: 'rgba(255, 170, 0, 0.3)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextGood: {
    color: colors.mintSuccess,
  },
  statusTextWarn: {
    color: colors.amberWarning,
  },
  syncButtonsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  syncNote: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    color: colors.iceBlue,
  },
  settingSection: {
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: colors.iceBlueSubtle,
    borderColor: colors.iceBlue,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
  },
  toggleThumbOn: {
    backgroundColor: colors.iceBlue,
    alignSelf: 'flex-end',
  },
  themeToggle: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeToggleText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dangerCard: {
    marginBottom: spacing.lg,
    borderColor: 'rgba(255, 107, 107, 0.25)',
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.dangerCoral,
    marginBottom: spacing.md,
  },
  dangerBtn: {
    marginBottom: spacing.sm,
  },
  dangerHint: {
    fontSize: 11,
    color: colors.textMuted,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appInfoText: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
    fontWeight: '600',
  },
});
