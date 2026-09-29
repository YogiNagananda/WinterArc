import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const PRESETS = [
  { label: 'Pomodoro', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Deep Work', minutes: 45 },
  { label: 'Power Hour', minutes: 60 },
];

export const FocusScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const tasks = useWinterStore(s => s.tasks);
  const focusTimer = useWinterStore(s => s.focusTimer);
  const startFocusTimer = useWinterStore(s => s.startFocusTimer);
  const pauseFocusTimer = useWinterStore(s => s.pauseFocusTimer);
  const resumeFocusTimer = useWinterStore(s => s.resumeFocusTimer);
  const stopFocusTimer = useWinterStore(s => s.stopFocusTimer);
  const resetFocusTimer = useWinterStore(s => s.resetFocusTimer);
  const setFocusTargetMinutes = useWinterStore(s => s.setFocusTargetMinutes);
  const setFocusSelectedTaskId = useWinterStore(s => s.setFocusSelectedTaskId);

  // Tick trigger to re-render display every second while timer is running
  const [, setTick] = useState(0);

  const { isRunning, isPaused, targetMinutes, startedAt, accumulatedMs, taskId, completedSessions } = focusTimer;

  // Calculate live elapsed seconds based on persistent timestamps
  const elapsedSeconds = useMemo(() => {
    if (!isRunning) return 0;
    let totalMs = accumulatedMs;
    if (!isPaused && startedAt) {
      totalMs += Math.max(0, Date.now() - startedAt);
    }
    return Math.floor(totalMs / 1000);
  }, [isRunning, isPaused, startedAt, accumulatedMs, focusTimer]);

  const totalTargetSeconds = targetMinutes * 60;
  const secondsLeft = Math.max(0, totalTargetSeconds - elapsedSeconds);

  // Interval for smooth countdown display while screen is mounted
  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        setTick(t => t + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused]);

  // Handle completion when time runs out
  useEffect(() => {
    if (isRunning && secondsLeft <= 0) {
      stopFocusTimer();
    }
  }, [isRunning, secondsLeft, stopFocusTimer]);

  const selectPreset = (min: number) => {
    if (isRunning) return;
    setFocusTargetMinutes(min);
  };

  const handleStartOrToggle = () => {
    if (!isRunning) {
      startFocusTimer(targetMinutes, taskId);
    } else if (isPaused) {
      resumeFocusTimer();
    } else {
      pauseFocusTimer();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Deep Focus Chamber</Text>
      <Text style={styles.subheading}>Zero distraction. Maximum discipline.</Text>

      {/* Preset Selector */}
      <View style={styles.presetsRow}>
        {PRESETS.map(p => {
          const isActive = targetMinutes === p.minutes;
          return (
            <TouchableOpacity
              key={p.label}
              disabled={isRunning}
              style={[styles.presetPill, isActive && styles.presetPillActive]}
              onPress={() => selectPreset(p.minutes)}
            >
              <Text style={[styles.presetText, isActive && styles.presetTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Glowing Timer Display */}
      <View style={styles.timerCircleOuter}>
        <View style={styles.timerCircleInner}>
          <Text style={styles.timerDisplay}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.timerSub}>
            {!isRunning ? 'READY TO GRIND' : isPaused ? 'PAUSED' : 'FOCUSING'}
          </Text>
          <Text style={styles.xpHint}>
            +{Math.round(targetMinutes * 0.8)} XP on completion
          </Text>
        </View>
      </View>

      {/* Timer Controls */}
      <View style={styles.controlsRow}>
        <Button
          title={!isRunning ? 'START FOCUS' : isPaused ? 'RESUME' : 'PAUSE'}
          onPress={handleStartOrToggle}
          variant={isRunning && !isPaused ? 'secondary' : 'primary'}
          size="lg"
          style={styles.mainControlBtn}
        />
        {isRunning && (
          <Button
            title="LOG SESSION"
            onPress={() => stopFocusTimer()}
            variant="primary"
            style={styles.logBtn}
          />
        )}
        <Button
          title="RESET"
          onPress={() => resetFocusTimer()}
          variant="ghost"
          style={styles.resetBtn}
        />
      </View>

      {/* Task / Subject Link */}
      <Card style={styles.linkCard}>
        <Text style={styles.linkTitle}>Focusing On (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {tasks.slice(0, 5).map(task => {
            const isSel = taskId === task.id;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskOption, isSel && styles.taskOptionActive]}
                onPress={() => setFocusSelectedTaskId(isSel ? undefined : task.id)}
              >
                <Text style={[styles.taskOptionText, isSel && styles.taskOptionTextActive]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Card>

      {/* Completed Today */}
      <Card style={styles.sessionsCard}>
        <Text style={styles.sessionsTitle}>Focus Completed Today</Text>
        {completedSessions.length === 0 ? (
          <Text style={styles.sessionsEmpty}>No sessions logged yet today. Complete your first 25m sprint!</Text>
        ) : (
          <View style={styles.sessionChips}>
            {completedSessions.map((min, idx) => (
              <View key={idx} style={styles.sessionChip}>
                <Text style={styles.sessionChipText}>⚡ {min}m Sprint</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
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
      alignItems: 'center',
    },
    heading: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 0.5,
    },
    subheading: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      marginBottom: spacing.lg,
    },
    presetsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    presetPill: {
      backgroundColor: colors.cardBg,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: colors.border,
    },
    presetPillActive: {
      backgroundColor: colors.iceBlueSubtle,
      borderColor: colors.iceBlue,
    },
    presetText: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '700',
    },
    presetTextActive: {
      color: colors.iceBlue,
    },
    timerCircleOuter: {
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: colors.cardBg,
      borderWidth: 3,
      borderColor: colors.iceBlue,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.iceBlue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 8,
      marginBottom: spacing.xl,
    },
    timerCircleInner: {
      alignItems: 'center',
    },
    timerDisplay: {
      fontSize: 52,
      fontWeight: '900',
      color: colors.textPrimary,
      letterSpacing: 2,
      fontVariant: ['tabular-nums'],
    },
    timerSub: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.mintSuccess,
      letterSpacing: 1.5,
      marginTop: 4,
    },
    xpHint: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 6,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl,
      width: '100%',
    },
    mainControlBtn: {
      flex: 2,
    },
    logBtn: {
      flex: 2,
      backgroundColor: colors.mintSuccess,
    },
    resetBtn: {
      flex: 1,
    },
    linkCard: {
      width: '100%',
      marginBottom: spacing.md,
    },
    linkTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    taskOption: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: colors.cardElevated,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    taskOptionActive: {
      borderColor: colors.iceBlue,
      backgroundColor: colors.iceBlueSubtle,
    },
    taskOptionText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    taskOptionTextActive: {
      color: colors.iceBlue,
    },
    sessionsCard: {
      width: '100%',
    },
    sessionsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    sessionsEmpty: {
      fontSize: 12,
      color: colors.textMuted,
      fontStyle: 'italic',
    },
    sessionChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    sessionChip: {
      backgroundColor: colors.mintSubtle,
      borderWidth: 1,
      borderColor: colors.mintSuccess,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    sessionChipText: {
      color: colors.mintSuccess,
      fontSize: 11,
      fontWeight: '700',
    },
  });
