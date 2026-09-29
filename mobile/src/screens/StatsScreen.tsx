import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';

// Heatmap — last 90 days
function generateHeatmapDates(count: number): string[] {
  const dates: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const BADGES = [
  { id: 'first_day', title: 'First Step', desc: 'Complete Day 1 of the arc', icon: '🌱', condition: 'streak_1' },
  { id: 'streak_7', title: 'One Week Iron', desc: '7-day unbroken streak', icon: '🔥', condition: 'streak_7' },
  { id: 'streak_30', title: 'Month of Discipline', desc: '30-day streak', icon: '⚡', condition: 'streak_30' },
  { id: 'streak_90', title: 'WINTER ARC COMPLETE', desc: '90-day arc completed', icon: '🏆', condition: 'streak_90' },
  { id: 'xp_100', title: 'Century XP', desc: 'Earn 100+ XP', icon: '💯', condition: 'xp_100' },
  { id: 'xp_1000', title: 'XP Millionaire', desc: 'Earn 1000+ XP', icon: '💰', condition: 'xp_1000' },
  { id: 'gym_10', title: 'Iron Regular', desc: 'Log 10+ gym sessions', icon: '🏋️', condition: 'gym_10' },
  { id: 'tasks_50', title: 'Habit Machine', desc: 'Complete 50+ tasks', icon: '✅', condition: 'tasks_50' },
];

export const StatsScreen: React.FC = () => {
  const profile = useWinterStore(s => s.profile);
  const completions = useWinterStore(s => s.completions);
  const gymSessions = useWinterStore(s => s.gymSessions);
  const dayRecords = useWinterStore(s => s.dayRecords);

  const heatmapDates = generateHeatmapDates(90);
  const completionDates = new Set(completions.map(c => c.date));

  // Compute badge unlock states
  const badgeStates: Record<string, boolean> = {
    streak_1: profile.streak >= 1,
    streak_7: profile.bestStreak >= 7,
    streak_30: profile.bestStreak >= 30,
    streak_90: profile.bestStreak >= 90,
    xp_100: profile.totalXp >= 100,
    xp_1000: profile.totalXp >= 1000,
    gym_10: gymSessions.length >= 10,
    tasks_50: completions.length >= 50,
  };

  const unlockedCount = Object.values(badgeStates).filter(Boolean).length;

  // Stats calculation
  const totalCompletions = completions.length;
  const totalFocusMin = 0; // Would come from focus sessions in real use
  const currentDay = Math.min(
    profile.arcLength,
    Math.max(
      1,
      Math.floor(
        (Date.now() - new Date(profile.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    )
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Winter Arc Statistics</Text>
      <Text style={styles.subheading}>Your 90-day discipline scoreboard</Text>

      {/* Summary Stats Grid */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statVal}>{profile.streak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>⚡</Text>
          <Text style={styles.statVal}>{profile.bestStreak}</Text>
          <Text style={styles.statLabel}>Best Streak</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>✨</Text>
          <Text style={styles.statVal}>{profile.totalXp}</Text>
          <Text style={styles.statLabel}>Total XP Earned</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>✅</Text>
          <Text style={styles.statVal}>{totalCompletions}</Text>
          <Text style={styles.statLabel}>Tasks Completed</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>🏋️</Text>
          <Text style={styles.statVal}>{gymSessions.length}</Text>
          <Text style={styles.statLabel}>Gym Sessions</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={styles.statVal}>Day {currentDay}</Text>
          <Text style={styles.statLabel}>Arc Progress</Text>
        </Card>
      </View>

      {/* 90-Day Heatmap */}
      <Text style={styles.sectionTitle}>90-Day Activity Heatmap</Text>
      <Card style={styles.heatmapCard}>
        <View style={styles.heatmapGrid}>
          {heatmapDates.map(date => {
            const hasTasks = completionDates.has(date);
            const isToday = date === new Date().toISOString().split('T')[0];

            return (
              <View
                key={date}
                style={[
                  styles.heatCell,
                  hasTasks && styles.heatCellActive,
                  isToday && styles.heatCellToday,
                ]}
              />
            );
          })}
        </View>
        <View style={styles.heatmapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.heatCell, { marginRight: 4 }]} />
            <Text style={styles.legendText}>No activity</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.heatCell, styles.heatCellActive, { marginRight: 4 }]} />
            <Text style={styles.legendText}>Tasks done</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.heatCell, styles.heatCellToday, { marginRight: 4 }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </Card>

      {/* Badges */}
      <Text style={styles.sectionTitle}>
        Badges — {unlockedCount}/{BADGES.length} Unlocked
      </Text>

      <View style={styles.badgesGrid}>
        {BADGES.map(badge => {
          const unlocked = badgeStates[badge.condition];
          return (
            <View
              key={badge.id}
              style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}
            >
              <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
                {badge.icon}
              </Text>
              <Text style={[styles.badgeTitle, !unlocked && styles.badgeTitleLocked]}>
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.desc}</Text>
            </View>
          );
        })}
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '30%',
    flexGrow: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.iceBlue,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  heatmapCard: {
    marginBottom: spacing.xl,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.md,
  },
  heatCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heatCellActive: {
    backgroundColor: colors.mintSuccess,
    opacity: 0.75,
  },
  heatCellToday: {
    backgroundColor: colors.iceBlue,
  },
  heatmapLegend: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    flexGrow: 1,
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  badgeCardLocked: {
    opacity: 0.35,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  badgeIconLocked: {
    opacity: 0.4,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.iceBlue,
    textAlign: 'center',
  },
  badgeTitleLocked: {
    color: colors.textMuted,
  },
  badgeDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
});
