import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatChip } from '../components/StatChip';
import { getLevel, getNextLevel, getLevelProgress, getXpToNextLevel } from '../lib/levels';

export const DashboardScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const profile = useWinterStore(s => s.profile);
  const tasks = useWinterStore(s => s.tasks);
  const completions = useWinterStore(s => s.completions);
  const goals = useWinterStore(s => s.goals);
  const goalLogs = useWinterStore(s => s.goalLogs);
  const toggleTaskCompletion = useWinterStore(s => s.toggleTaskCompletion);
  const updateGoalProgress = useWinterStore(s => s.updateGoalProgress);
  const setActiveTab = useWinterStore(s => s.setActiveTab);
  const acceptChallenge = useWinterStore(s => s.acceptChallenge);
  const fullDayClearedToast = useWinterStore(s => s.fullDayClearedToast);
  const clearFullDayToast = useWinterStore(s => s.clearFullDayToast);

  const today = new Date().toISOString().split('T')[0];

  // User Level based on XP Points
  const currentLevel = getLevel(profile.totalXp);
  const nextLevel = getNextLevel(profile.totalXp);
  const levelProgress = getLevelProgress(profile.totalXp);
  const xpNeeded = getXpToNextLevel(profile.totalXp);

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

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Full Day / Goal Completion Celebration Toast */}
      {fullDayClearedToast ? (
        <View style={styles.celebrationToast}>
          <View style={styles.celebrationHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.celebrationIcon}>🏆</Text>
              <Text style={styles.celebrationTitle}>DISCIPLINE REWARD UNLOCKED</Text>
            </View>
            <TouchableOpacity onPress={clearFullDayToast} style={styles.toastCloseBtn}>
              <Text style={styles.toastCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.celebrationMsg}>{fullDayClearedToast}</Text>
          <Text style={styles.celebrationHint}>
            Guilt-free entertainment unlocked! Shop your reward points for video games 🎮, movies 🎬, or TV series 🍿.
          </Text>
          <View style={styles.celebrationBtnRow}>
            <Button
              title="🎁 Go to Rewards Shop"
              size="sm"
              variant="primary"
              onPress={() => {
                clearFullDayToast();
                setActiveTab('rewards');
              }}
            />
            <Button
              title="Dismiss"
              size="sm"
              variant="ghost"
              onPress={clearFullDayToast}
            />
          </View>
        </View>
      ) : null}

      {/* Initiation Card (Shown if challenge not yet accepted) */}
      {!profile.challengeAccepted && (
        <Card elevated style={styles.initiationCard}>
          <View style={styles.initiationHeader}>
            <Text style={styles.initiationBadge}>⚔️ ARC INITIATION</Text>
            <Text style={styles.initiationXp}>+100 XP BONUS</Text>
          </View>
          <Text style={styles.initiationTitle}>Join the Winter Arc Challenge</Text>
          <Text style={styles.initiationDesc}>
            Commit to 90 days of unapologetic discipline, heavy lifting, razor focus, and mental toughness.
          </Text>
          <View style={styles.initiationPerks}>
            <Text style={styles.initiationPerk}>🔥 Shifts Day Streak from 0 to 1</Text>
            <Text style={styles.initiationPerk}>💎 Awards +100 Spendable & Total XP</Text>
            <Text style={styles.initiationPerk}>🎖️ Unlocks "Pledge of Iron" & "First Step" Badges</Text>
          </View>
          <Button
            title="⚔️ ACCEPT THE CHALLENGE (+100 XP)"
            onPress={acceptChallenge}
            variant="primary"
            size="lg"
            style={styles.initiationBtn}
          />
        </Card>
      )}

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

        {/* Stats Chips Row */}
        <View style={styles.statChipsRow}>
          <StatChip label="Level" value={currentLevel.name} icon={currentLevel.icon} color="ice" />
          <StatChip label="Streak" value={`${profile.streak}d`} icon="🔥" color="amber" />
          <StatChip label="XP Points" value={profile.totalXp} icon="⚡" color="ice" />
          <StatChip label="Tasks" value={`${completedCount}/${todayTasks.length}`} icon="✅" color="mint" />
        </View>
      </Card>

      {/* User Level Mastery Card */}
      <Card elevated style={styles.levelCard}>
        <View style={styles.levelHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.levelCardIcon}>{currentLevel.icon}</Text>
            <View>
              <Text style={styles.levelCardName}>LEVEL {currentLevel.name.toUpperCase()}</Text>
              <Text style={styles.levelCardSub}>{currentLevel.title}</Text>
            </View>
          </View>
          <View style={styles.levelXpBadge}>
            <Text style={styles.levelXpBadgeText}>⚡ {profile.totalXp} XP</Text>
          </View>
        </View>

        {/* Level Progress Bar */}
        <View style={styles.levelProgressBarTrack}>
          <View style={[styles.levelProgressBarFill, { width: `${levelProgress}%` }]} />
        </View>

        <View style={styles.levelFooterRow}>
          <Text style={styles.levelProgressText}>{levelProgress}% toward promotion</Text>
          {nextLevel ? (
            <Text style={styles.nextLevelText}>
              {xpNeeded} XP to <Text style={{ color: colors.iceBlue, fontWeight: '800' }}>{nextLevel.name} {nextLevel.icon}</Text>
            </Text>
          ) : (
            <Text style={styles.nextLevelText}>MAX LEVEL REACHED 🏆</Text>
          )}
        </View>
      </Card>

      {/* Daily Motivation Quote */}
      <Card style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>
          He who conquers himself is the mightiest warrior. The winter is not meant to break you, but to forge you.
        </Text>
        <Text style={styles.quoteAuthor}>— Confucius</Text>
      </Card>

      {/* Quick Action Shortcuts */}
      <View style={styles.quickActions}>
        <Button
          title="Focus Chamber"
          onPress={() => setActiveTab('focus')}
          variant="primary"
          size="md"
          icon={<Text style={styles.btnIcon}>⏱️</Text>}
          style={styles.actionBtn}
        />
        <Button
          title="Log Workout"
          onPress={() => setActiveTab('gym')}
          variant="secondary"
          size="md"
          icon={<Text style={styles.btnIcon}>🏋️</Text>}
          style={styles.actionBtn}
        />
      </View>

      {/* Today's Tasks */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Non-Negotiables</Text>
        <TouchableOpacity onPress={() => setActiveTab('tasks')}>
          <Text style={styles.sectionLink}>View All ({todayTasks.length}) →</Text>
        </TouchableOpacity>
      </View>

      {todayTasks.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tasks planned for today. Tap Tasks below to build your discipline routine.</Text>
        </Card>
      ) : (
        todayTasks.slice(0, 4).map(task => {
          const isDone = todayCompletedIds.has(task.id);
          return (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskItem, isDone && styles.taskItemDone]}
              onPress={() => toggleTaskCompletion(task.id, today)}
              activeOpacity={0.7}
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

      {/* Active Goals */}
      <View style={[styles.sectionHeader, { marginTop: spacing.xl }]}>
        <Text style={styles.sectionTitle}>Active 90-Day Goals</Text>
        <TouchableOpacity onPress={() => setActiveTab('goals')}>
          <Text style={styles.sectionLink}>Manage Goals →</Text>
        </TouchableOpacity>
      </View>

      {goals.slice(0, 3).map(goal => {
        const todayLog = goalLogs.find(l => l.goalId === goal.id && l.date === today);
        const currentVal = todayLog?.value || 0;
        const goalPercent = Math.min(100, Math.round((currentVal / goal.target) * 100));

        return (
          <Card key={goal.id} style={styles.goalCard}>
            <View style={styles.goalTopRow}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalProgressNum}>
                {currentVal} / {goal.target} {goal.unit}
              </Text>
            </View>

            <View style={styles.progressBarTrack}>
              <View
                style={[styles.goalProgressBarFill, { width: `${goalPercent}%` }]}
              />
            </View>

            <View style={styles.goalStepperRow}>
              <Text style={styles.goalPct}>{goalPercent}% complete</Text>
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

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 40,
    },
    celebrationToast: {
      backgroundColor: colors.cardElevated,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1.5,
      borderColor: colors.mintSuccess,
    },
    celebrationHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    celebrationIcon: {
      fontSize: 16,
      marginRight: 6,
    },
    celebrationTitle: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.mintSuccess,
      letterSpacing: 0.5,
    },
    toastCloseBtn: {
      padding: 4,
    },
    toastCloseText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '800',
    },
    celebrationMsg: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    celebrationHint: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    celebrationBtnRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    initiationCard: {
      marginBottom: spacing.lg,
      borderWidth: 1.5,
      borderColor: colors.iceBlue,
      backgroundColor: colors.cardElevated,
    },
    initiationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    initiationBadge: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 1,
    },
    initiationXp: {
      fontSize: 11,
      fontWeight: '900',
      color: colors.mintSuccess,
    },
    initiationTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    initiationDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: spacing.md,
    },
    initiationPerks: {
      gap: 4,
      marginBottom: spacing.md,
    },
    initiationPerk: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
    initiationBtn: {
      width: '100%',
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
      backgroundColor: colors.border,
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
    levelCard: {
      marginBottom: spacing.lg,
      backgroundColor: colors.cardElevated,
      borderWidth: 1,
      borderColor: colors.borderActive,
    },
    levelHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    levelCardIcon: {
      fontSize: 26,
      marginRight: 10,
    },
    levelCardName: {
      fontSize: 14,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 0.5,
    },
    levelCardSub: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    levelXpBadge: {
      backgroundColor: colors.iceBlueSubtle,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.iceBlue,
    },
    levelXpBadgeText: {
      color: colors.iceBlue,
      fontSize: 11,
      fontWeight: '900',
    },
    levelProgressBarTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 8,
    },
    levelProgressBarFill: {
      height: '100%',
      backgroundColor: colors.iceBlue,
      borderRadius: 3,
    },
    levelFooterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    levelProgressText: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    nextLevelText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
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
