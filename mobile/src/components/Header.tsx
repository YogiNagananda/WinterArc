import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { getLevel } from '../lib/levels';

export const Header: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const profile = useWinterStore(s => s.profile);
  const isSyncing = useWinterStore(s => s.isSyncing);
  const setActiveTab = useWinterStore(s => s.setActiveTab);

  const userLevel = getLevel(profile.totalXp);

  // Calculate day of the arc
  const start = new Date(profile.startDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
  const currentDay = Math.min(profile.arcLength, diffDays);

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={styles.logo}>❄️</Text>
          <Text style={styles.brand}>WINTER ARC</Text>
        </View>
        <Text style={styles.daySub}>
          DAY {currentDay} <Text style={{ color: colors.textMuted }}>/ {profile.arcLength}</Text>
        </Text>
      </View>

      <View style={styles.right}>
        {/* Level Pill */}
        <View style={styles.levelPill}>
          <Text style={styles.levelEmoji}>{userLevel.icon}</Text>
          <Text style={styles.levelVal}>{userLevel.name}</Text>
        </View>

        {/* Streak Pill */}
        <View style={styles.streakPill}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakVal}>{profile.streak}d</Text>
        </View>

        {/* XP Pill */}
        <View style={styles.xpPill}>
          <Text style={styles.xpVal}>⚡ {profile.totalXp}</Text>
        </View>

        {/* Supabase Sync status */}
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.syncDot, isSyncing ? styles.syncDotSyncing : styles.syncDotLive]} />
          <Text style={styles.cloudText}>☁️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      backgroundColor: colors.bgPrimary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    left: {
      flexDirection: 'column',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logo: {
      fontSize: 16,
      marginRight: 6,
    },
    brand: {
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 1.2,
      color: colors.iceBlue,
    },
    daySub: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.mintSuccess,
      marginTop: 2,
      letterSpacing: 0.5,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    levelPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardElevated,
      borderWidth: 1,
      borderColor: colors.borderActive,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      marginRight: 6,
    },
    levelEmoji: {
      fontSize: 11,
      marginRight: 3,
    },
    levelVal: {
      color: colors.iceBlue,
      fontSize: 11,
      fontWeight: '800',
    },
    streakPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.amberSubtle,
      borderWidth: 1,
      borderColor: 'rgba(255, 170, 0, 0.4)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      marginRight: 6,
    },
    streakEmoji: {
      fontSize: 12,
      marginRight: 4,
    },
    streakVal: {
      color: colors.amberWarning,
      fontSize: 12,
      fontWeight: '800',
    },
    xpPill: {
      backgroundColor: colors.iceBlueSubtle,
      borderWidth: 1,
      borderColor: 'rgba(0, 217, 255, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
      marginRight: 8,
    },
    xpVal: {
      color: colors.iceBlue,
      fontSize: 12,
      fontWeight: '800',
    },
    syncBtn: {
      position: 'relative',
      padding: 4,
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    syncDot: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 7,
      height: 7,
      borderRadius: 4,
      zIndex: 2,
    },
    syncDotLive: {
      backgroundColor: colors.mintSuccess,
    },
    syncDotSyncing: {
      backgroundColor: colors.iceBlue,
    },
    cloudText: {
      fontSize: 14,
    },
  });
