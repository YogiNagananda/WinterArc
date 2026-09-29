import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
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
  const tasks = useWinterStore(s => s.tasks);
  const studySubjects = useWinterStore(s => s.studySubjects);
  const logFocusSession = useWinterStore(s => s.logFocusSession);

  const [selectedMinutes, setSelectedMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<number[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const selectPreset = (min: number) => {
    if (isRunning) return;
    setSelectedMinutes(min);
    setSecondsLeft(min * 60);
  };

  const togglePlay = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(selectedMinutes * 60);
  };

  const handleComplete = () => {
    setIsRunning(false);
    logFocusSession(selectedMinutes, selectedTaskId);
    setCompletedSessions(prev => [selectedMinutes, ...prev]);
    setSecondsLeft(selectedMinutes * 60);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - secondsLeft / (selectedMinutes * 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Deep Focus Chamber</Text>
      <Text style={styles.subheading}>Zero distraction. Maximum discipline.</Text>

      {/* Preset Selector */}
      <View style={styles.presetsRow}>
        {PRESETS.map(p => {
          const isActive = selectedMinutes === p.minutes;
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
            {isRunning ? 'FOCUSING' : 'READY TO GRIND'}
          </Text>
          <Text style={styles.xpHint}>
            +{Math.round(selectedMinutes * 0.8)} XP on completion
          </Text>
        </View>
      </View>

      {/* Timer Controls */}
      <View style={styles.controlsRow}>
        <Button
          title={isRunning ? 'PAUSE' : 'START FOCUS'}
          onPress={togglePlay}
          variant={isRunning ? 'secondary' : 'primary'}
          size="lg"
          style={styles.mainControlBtn}
        />
        <Button
          title="RESET"
          onPress={resetTimer}
          variant="ghost"
          style={styles.resetBtn}
        />
      </View>

      {/* Task / Subject Link */}
      <Card style={styles.linkCard}>
        <Text style={styles.linkTitle}>Focusing On (Optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {tasks.slice(0, 5).map(task => {
            const isSel = selectedTaskId === task.id;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskOption, isSel && styles.taskOptionActive]}
                onPress={() => setSelectedTaskId(isSel ? undefined : task.id)}
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

const styles = StyleSheet.create({
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
    gap: spacing.md,
    marginBottom: spacing.xl,
    width: '100%',
  },
  mainControlBtn: {
    flex: 2,
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
