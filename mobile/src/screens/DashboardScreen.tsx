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
import { Button } from '../components/Button';
import { StatChip } from '../components/StatChip';

export const DashboardScreen: React.FC = () => {
  const profile = useWinterStore(s => s.profile);
  const tasks = useWinterStore(s => s.tasks);
  const completions = useWinterStore(s => s.completions);
  const goals = useWinterStore(s => s.goals);
  const goalLogs = useWinterStore(s => s.goalLogs);
  const toggleTaskCompletion = useWinterStore(s => s.toggleTaskCompletion);
  const updateGoalProgress = useWinterStore(s => s.updateGoalProgress);
  const setActiveTab = useWinterStore(s => s.setActiveTab);

  const today = new Date().toISOString().split('T')[0];

  // Arc calculation
  const start = new Date(profile.startDate).getTime();
  const now = new Date().getTime();
  const diffDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
  const currentDay = Math.min(profile.arcLength, diffDays);
  const progressPercent = Math.min(100, Math.round((currentDay / profile.arcLength) * 100));

  // Today's completed tasks
  const todayTasks = tasks.filter(t => !t.archived);
  const todayCompletedIds = new Set(
    completions.filter(c => c.date === today).map(c => c.taskId)
  );
  const completedCount = todayTasks.filter(t => todayCompletedIds.has(t.id)).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 90-Day Arc Progress Banner */}
      <Card elevated style={styles.arcBanner}>
        <View style={styles.arcHeaderRow}>
          <View>
            <Text style={styles.arcTitle}>WINTER ARC DISCIPLINE</Text>
            <Text style={styles.arcSub}>
              Day <Text style={styles.accentText}>{currentDay}</Text> of {profile.arcLength} • {profile.arcLength - currentDay} days remaining
            </Text>
          </View>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>{progressPercent}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* Stats Row */}
        <View style={styles.statChipsRow}>
          <StatChip label="Streak" value={`${profile.streak}d`} icon="🔥" color="amber" />
          <StatChip label="Best" value={`${profile.bestStreak}d`} icon="⚡" color="ice" />
          <StatChip label="Freezes" value={`${profile.freezesLeft}`} icon="🛡️" color="mint" />
          <StatChip label="XP" value={profile.totalXp} icon="✨" color="ice" />
        </View>
      </Card>

      {/* Daily Motivation Quote */}
      <Card style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>
          The pain of discipline weighs ounces. The pain of regret weighs tons. Transform in the winter.
        </Text>
        <Text style={styles.quoteAuthor}>— Winter Arc Manifesto</Text>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          title="Start Focus"
          onPress={() => setActiveTab('focus')}
          variant="primary"
          style={styles.actionBtn}
          icon={<Text style={styles.btnIcon}>⏱️</Text>}
        />
        <Button
          title="Log Workout"
          onPress={() => setActiveTab('gym')}
          variant="secondary"
          style={styles.actionBtn}
          icon={<Text style={styles.btnIcon}>🏋️</Text>}
        />
      </View>

      {/* Today's Non-Negotiables Checklist */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Non-Negotiables</Text>
        <TouchableOpacity onPress={() => setActiveTab('tasks')}>
          <Text style={styles.sectionLink}>
            {completedCount}/{todayTasks.length} Done • View All →
          </Text>
        </TouchableOpacity>
      </View>

      {todayTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tasks planned for today. Tap below to create your first discipline habit.</Text>
          <Button
            title="+ Add Daily Habit"
            onPress={() => setActiveTab('tasks')}
            variant="ghost"
            style={{ marginTop: 8 }}
          />
        </Card>
      ) : (
        todayTasks.slice(0, 4).map(task => {
          const isDone = todayCompletedIds.has(task.id);
          return (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.8}
              onPress={() => toggleTaskCompletion(task.id, today)}
              style={[styles.taskItem, isDone && styles.taskItemDone]}
            >
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                {isDone && <Text style={styles.checkIcon}>✓</Text>}
              </View>

              <View style={styles.taskTextCol}>
                <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                  {task.title}
                </Text>
                <View style={styles.taskMetaRow}>
                  <Text style={styles.categoryBadge}>{task.category}</Text>
                  <Text style={styles.xpBadge}>+{task.xp} XP</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* Active 90-Day Goals */}
      <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>90-Day Milestones</Text>
        <TouchableOpacity onPress={() => setActiveTab('goals')}>
          <Text style={styles.sectionLink}>Manage →</Text>
        </TouchableOpacity>
      </View>

      {goals.slice(0, 3).map(goal => {
        const log = goalLogs.find(l => l.goalId === goal.id && l.date === today);
        const currentVal = log ? log.value : 0;
        const pct = Math.min(100, Math.round((currentVal / goal.target) * 100));

        return (
          <Card key={goal.id} style={styles.goalCard}>
            <View style={styles.goalTopRow}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalProgressNum}>
                {currentVal} / {goal.target} {goal.unit}
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.goalProgressBarFill, { width: `${pct}%` }]} />
            </View>

            <View style={styles.goalStepperRow}>
              <Text style={styles.goalPct}>{pct}% completed</Text>
              <View style={styles.stepperBtns}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateGoalProgress(goal.id, today, -goal.step)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stepBtn, styles.stepBtnAdd]}
                  onPress={() => updateGoalProgress(goal.id, today, goal.step)}
                >
                  <Text style={[styles.stepBtnText, styles.stepBtnAddText]}>+{goal.step}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        );
      })}
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
  arcBanner: {
    marginBottom: spacing.lg,
  },
  arcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  arcTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.iceBlue,
    letterSpacing: 1,
  },
  arcSub: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  accentText: {
    color: colors.mintSuccess,
    fontSize: 16,
    fontWeight: '900',
  },
  percentBadge: {
    backgroundColor: colors.iceBlueSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.iceBlue,
  },
  percentText: {
    color: colors.iceBlue,
    fontWeight: '900',
    fontSize: 13,
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
  goalProgressBarFill: {
    height: '100%',
    backgroundColor: colors.iceBlue,
    borderRadius: 4,
  },
  statChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },
  quoteCard: {
    backgroundColor: colors.cardElevated,
    borderLeftWidth: 3,
    borderLeftColor: colors.iceBlue,
    marginBottom: spacing.lg,
  },
  quoteMark: {
    fontSize: 28,
    color: colors.iceBlue,
    lineHeight: 28,
    fontWeight: '900',
  },
  quoteText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: -8,
  },
  quoteAuthor: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionBtn: {
    flex: 1,
  },
  btnIcon: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.iceBlue,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskItemDone: {
    backgroundColor: colors.mintSubtle,
    borderColor: 'rgba(0, 217, 127, 0.3)',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxDone: {
    backgroundColor: colors.mintSuccess,
    borderColor: colors.mintSuccess,
  },
  checkIcon: {
    color: '#082519',
    fontWeight: '900',
    fontSize: 14,
  },
  taskTextCol: {
    flex: 1,
  },
  taskTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.iceBlue,
    backgroundColor: colors.iceBlueSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  xpBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.mintSuccess,
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  goalProgressNum: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.iceBlue,
  },
  goalStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  goalPct: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  stepperBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 16,
  },
  stepBtnAdd: {
    backgroundColor: colors.iceBlueSubtle,
    borderColor: colors.iceBlue,
    width: 44,
  },
  stepBtnAddText: {
    color: colors.iceBlue,
    fontSize: 13,
  },
});
