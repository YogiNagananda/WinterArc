import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../theme/colors';
import { ScreenTab, useWinterStore } from '../store/useWinterStore';

export const BottomTabs: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const activeTab = useWinterStore(s => s.activeTab);
  const setActiveTab = useWinterStore(s => s.setActiveTab);
  const [moreModalVisible, setMoreModalVisible] = useState(false);

  const mainTabs: { key: ScreenTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Home', icon: '🏛️' },
    { key: 'tasks', label: 'Tasks', icon: '✅' },
    { key: 'focus', label: 'Focus', icon: '⏱️' },
    { key: 'goals', label: 'Goals', icon: '🎯' },
  ];

  const moreFeatures: { key: ScreenTab; label: string; icon: string; desc: string }[] = [
    { key: 'gym', label: 'Gym & Workouts', icon: '🏋️', desc: 'Sets, reps, weights, split tracker' },
    { key: 'study', label: 'Study & Work', icon: '📚', desc: 'Weekly targets and focus logs' },
    { key: 'rewards', label: 'Rewards Shop', icon: '🎁', desc: 'Redeem discipline XP for rewards' },
    { key: 'notes', label: 'Notes & Journal', icon: '📝', desc: 'Non-negotiables & mood reflection' },
    { key: 'stats', label: 'Heatmap & Badges', icon: '📊', desc: '90-day progress & arc achievements' },
    { key: 'settings', label: 'Settings & Supabase', icon: '⚙️', desc: 'Cloud database sync & profile' },
  ];

  const isMoreActive = moreFeatures.some(f => f.key === activeTab);
  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <>
      <View style={styles.tabBar}>
        {mainTabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* More Tab */}
        <TouchableOpacity
          style={[styles.tabItem, isMoreActive && styles.tabItemActive]}
          onPress={() => setMoreModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>⚡</Text>
          <Text style={[styles.tabLabel, isMoreActive && styles.tabLabelActive]}>
            {isMoreActive ? activeTab.toUpperCase() : 'More'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* More Hub Modal */}
      <Modal
        visible={moreModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMoreModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMoreModalVisible(false)}
        >
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.dragHandle} />
            <Text style={styles.modalTitle}>WinterArc Command Center</Text>
            <Text style={styles.modalSub}>All 10 features at your command</Text>

            <View style={styles.menuGrid}>
              {moreFeatures.map(f => {
                const isCurrent = activeTab === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.menuItem, isCurrent && styles.menuItemCurrent]}
                    onPress={() => {
                      setActiveTab(f.key);
                      setMoreModalVisible(false);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.menuIcon}>{f.icon}</Text>
                    <View style={styles.menuTextContainer}>
                      <Text style={[styles.menuLabel, isCurrent && styles.menuLabelCurrent]}>
                        {f.label}
                      </Text>
                      <Text style={styles.menuDesc}>{f.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.bgSecondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.sm,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.sm,
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: borderRadius.md,
    },
    tabItemActive: {
      backgroundColor: colors.iceBlueSubtle,
    },
    tabIcon: {
      fontSize: 18,
      marginBottom: 3,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },
    tabLabelActive: {
      color: colors.iceBlue,
      fontWeight: '800',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.cardElevated,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      padding: spacing.xl,
      paddingBottom: spacing.xxxl,
      borderWidth: 1,
      borderColor: colors.borderActive,
    },
    dragHandle: {
      width: 40,
      height: 4,
      backgroundColor: colors.borderActive,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 0.5,
    },
    modalSub: {
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    menuGrid: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuItemCurrent: {
      borderColor: colors.iceBlue,
      backgroundColor: colors.iceBlueSubtle,
    },
    menuIcon: {
      fontSize: 24,
      marginRight: spacing.md,
    },
    menuTextContainer: {
      flex: 1,
    },
    menuLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    menuLabelCurrent: {
      color: colors.iceBlue,
    },
    menuDesc: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
