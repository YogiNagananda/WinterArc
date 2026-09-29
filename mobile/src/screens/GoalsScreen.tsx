import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { GoalType } from '../types';

export const GoalsScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const goals = useWinterStore(s => s.goals);
  const goalLogs = useWinterStore(s => s.goalLogs);
  const updateGoalProgress = useWinterStore(s => s.updateGoalProgress);
  const addGoal = useWinterStore(s => s.addGoal);
  const deleteGoal = useWinterStore(s => s.deleteGoal);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('90');
  const [unit, setUnit] = useState('days');
  const [step, setStep] = useState('1');
  const [type, setType] = useState<GoalType>('counter');

  const today = new Date().toISOString().split('T')[0];

  const handleCreate = async () => {
    if (!title.trim()) return;
    await addGoal({
      title: title.trim(),
      type,
      target: parseFloat(target) || 1,
      step: parseFloat(step) || 1,
      unit: unit.trim() || '',
      icon: '🎯',
      archived: false,
    });
    setTitle('');
    setModalVisible(false);
  };

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>90-Day Arc Targets</Text>
          <Text style={styles.subheading}>Measurable outcomes for your transformation</Text>
        </View>
        <Button
          title="+ Add Goal"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      {goals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Arc Goals Set</Text>
          <Text style={styles.emptyText}>
            Define targets (e.g. Read 5 Books, 50 Gym Sessions, Run 100km).
          </Text>
        </Card>
      ) : (
        goals.map(goal => {
          const todayLog = goalLogs.find(l => l.goalId === goal.id && l.date === today);
          const currentVal = todayLog?.value || 0;
          const pct = Math.min(100, Math.round((currentVal / goal.target) * 100));
          const isComplete = currentVal >= goal.target;

          return (
            <Card
              key={goal.id}
              style={[styles.goalCard, isComplete && styles.goalCardDone]}
            >
              <View style={styles.goalTopRow}>
                <View style={styles.goalTitleContainer}>
                  <Text style={styles.goalIcon}>{goal.icon || '🎯'}</Text>
                  <Text style={styles.goalTitle}>{goal.title}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteGoal(goal.id)}
                >
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.progressRow}>
                <Text style={styles.metricText}>
                  Progress: <Text style={styles.boldMetric}>{currentVal}</Text> / {goal.target} {goal.unit}
                </Text>
                <Text style={styles.pctText}>{pct}%</Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>

              <View style={styles.stepperContainer}>
                <Text style={styles.stepperHint}>Tap + to log today's progress</Text>
                <View style={styles.stepperButtonGroup}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => updateGoalProgress(goal.id, today, -goal.step)}
                  >
                    <Text style={styles.stepBtnText}>-{goal.step}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.stepBtn, styles.stepBtnAdd]}
                    onPress={() => updateGoalProgress(goal.id, today, goal.step)}
                  >
                    <Text style={[styles.stepBtnText, styles.stepBtnAddText]}>
                      +{goal.step} {goal.unit}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })
      )}

      {/* Add Goal Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set New Arc Target</Text>

            <TextInput
              style={styles.input}
              placeholder="Goal title (e.g. Read 5 Non-Fiction Books)"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.rowInputs}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.fieldLabel}>TARGET</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 5"
                  placeholderTextColor={colors.textMuted}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.fieldLabel}>UNIT</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. books, km, hrs"
                  placeholderTextColor={colors.textMuted}
                  value={unit}
                  onChangeText={setUnit}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>STEP PER TAP</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1"
              placeholderTextColor={colors.textMuted}
              value={step}
              onChangeText={setStep}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Save Target"
                onPress={handleCreate}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    heading: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.textPrimary,
    },
    subheading: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    emptyCard: {
      alignItems: 'center',
      padding: spacing.xl,
      marginTop: spacing.xl,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    goalCard: {
      marginBottom: spacing.md,
    },
    goalCardDone: {
      borderColor: 'rgba(0, 217, 127, 0.4)',
    },
    goalTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    goalTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    goalIcon: {
      fontSize: 18,
      marginRight: 8,
    },
    goalTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    deleteBtn: {
      padding: 4,
    },
    deleteText: {
      color: colors.textMuted,
      fontSize: 14,
    },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 6,
    },
    metricText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    boldMetric: {
      fontWeight: '900',
      color: colors.iceBlue,
      fontSize: 15,
    },
    pctText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.iceBlue,
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
      backgroundColor: colors.iceBlue,
      borderRadius: 4,
    },
    stepperContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    stepperHint: {
      fontSize: 11,
      color: colors.textMuted,
    },
    stepperButtonGroup: {
      flexDirection: 'row',
      gap: 8,
    },
    stepBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      backgroundColor: colors.cardElevated,
      borderWidth: 1,
      borderColor: colors.borderActive,
    },
    stepBtnText: {
      color: colors.textSecondary,
      fontWeight: '800',
      fontSize: 13,
    },
    stepBtnAdd: {
      backgroundColor: colors.iceBlueSubtle,
      borderColor: colors.iceBlue,
    },
    stepBtnAddText: {
      color: colors.iceBlue,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: colors.cardElevated,
      borderRadius: borderRadius.xl,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: colors.borderActive,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.iceBlue,
      marginBottom: spacing.lg,
    },
    input: {
      backgroundColor: colors.cardBg,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      color: colors.textPrimary,
      fontSize: 14,
      marginBottom: spacing.md,
    },
    rowInputs: {
      flexDirection: 'row',
    },
    fieldLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textMuted,
      marginBottom: 6,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
