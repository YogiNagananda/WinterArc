import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { GymExercise } from '../types';

const SPLIT_PRESETS = ['Push Day', 'Pull Day', 'Legs', 'Upper Body', 'Full Body'];

export const GymScreen: React.FC = () => {
  const gymSessions = useWinterStore(s => s.gymSessions);
  const weightLogs = useWinterStore(s => s.weightLogs);
  const addGymSession = useWinterStore(s => s.addGymSession);
  const logWeight = useWinterStore(s => s.logWeight);

  const [modalVisible, setModalVisible] = useState(false);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [bodyWeight, setBodyWeight] = useState('');

  // Workout logger state
  const [workoutName, setWorkoutName] = useState('Push Day');
  const [exerciseName, setExerciseName] = useState('');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('60');
  const [currentExercises, setCurrentExercises] = useState<GymExercise[]>([]);

  const handleAddSet = () => {
    if (!exerciseName.trim()) return;
    const r = parseInt(reps) || 10;
    const w = parseFloat(weight) || 0;

    const existingIndex = currentExercises.findIndex(
      e => e.name.toLowerCase() === exerciseName.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...currentExercises];
      updated[existingIndex].sets.push({ reps: r, weight: w });
      setCurrentExercises(updated);
    } else {
      setCurrentExercises([
        ...currentExercises,
        {
          name: exerciseName.trim(),
          sets: [{ reps: r, weight: w }],
        },
      ]);
    }
  };

  const handleSaveWorkout = async () => {
    if (currentExercises.length === 0) return;
    await addGymSession(currentExercises);
    setCurrentExercises([]);
    setExerciseName('');
    setModalVisible(false);
  };

  const handleSaveWeight = async () => {
    const val = parseFloat(bodyWeight);
    if (!val) return;
    await logWeight(val);
    setBodyWeight('');
    setWeightModalVisible(false);
  };

  const latestWeight = weightLogs[0]?.kg || '--';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Iron Discipline (Gym)</Text>
          <Text style={styles.subheading}>Compound lifts, muscle hypertrophy & scale weight</Text>
        </View>
        <Button
          title="+ Log Workout"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      {/* Bodyweight Tracker Card */}
      <Card elevated style={styles.weightCard}>
        <View style={styles.weightRow}>
          <View>
            <Text style={styles.weightLabel}>CURRENT BODY WEIGHT</Text>
            <Text style={styles.weightVal}>
              {latestWeight} <Text style={{ fontSize: 16, color: colors.textMuted }}>kg</Text>
            </Text>
          </View>
          <Button
            title="Log Scale"
            onPress={() => setWeightModalVisible(true)}
            size="sm"
            variant="secondary"
          />
        </View>
      </Card>

      {/* Split Presets */}
      <Text style={styles.sectionTitle}>Split Presets</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        {SPLIT_PRESETS.map(split => (
          <TouchableOpacity
            key={split}
            style={styles.splitPill}
            onPress={() => {
              setWorkoutName(split);
              setModalVisible(true);
            }}
          >
            <Text style={styles.splitText}>{split}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Workout History */}
      <Text style={styles.sectionTitle}>Workout History</Text>
      {gymSessions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No gym workouts logged yet. Hit the weights and log your sets!</Text>
        </Card>
      ) : (
        gymSessions.map(session => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionDate}>📅 {session.date}</Text>
              <Text style={styles.sessionXp}>+50 XP</Text>
            </View>

            {session.exercises.map((ex, i) => (
              <View key={i} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.setRow}>
                  {ex.sets.map((s, idx) => (
                    <Text key={idx} style={styles.setTag}>
                      {s.weight}kg × {s.reps}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </Card>
        ))
      )}

      {/* Log Workout Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Training: {workoutName}</Text>

            <TextInput
              style={styles.input}
              placeholder="Exercise (e.g. Barbell Bench Press, Squats)"
              placeholderTextColor={colors.textMuted}
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <View style={styles.inputsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  placeholderTextColor={colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>REPS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10"
                  placeholderTextColor={colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title="+ Add Set to Exercise"
              onPress={handleAddSet}
              variant="secondary"
              size="sm"
              style={{ marginBottom: spacing.md }}
            />

            {/* Current exercise list */}
            {currentExercises.length > 0 && (
              <View style={styles.currentExBox}>
                <Text style={styles.currentExTitle}>Added Exercises:</Text>
                {currentExercises.map((e, idx) => (
                  <Text key={idx} style={styles.currentExLine}>
                    • {e.name}: {e.sets.length} sets logged
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Workout"
                variant="success"
                onPress={handleSaveWorkout}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Log Scale Modal */}
      <Modal
        visible={weightModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWeightModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Scale Weight</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 76.5"
              placeholderTextColor={colors.textMuted}
              value={bodyWeight}
              onChangeText={setBodyWeight}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setWeightModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                variant="primary"
                onPress={handleSaveWeight}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  weightCard: {
    marginBottom: spacing.lg,
  },
  weightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  weightVal: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.iceBlue,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  splitPill: {
    backgroundColor: colors.cardBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  splitText: {
    color: colors.iceBlue,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sessionCard: {
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sessionXp: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.mintSuccess,
  },
  exerciseItem: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setTag: {
    fontSize: 11,
    color: colors.iceBlue,
    backgroundColor: colors.iceBlueSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  inputsRow: {
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 4,
  },
  currentExBox: {
    backgroundColor: colors.cardBg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  currentExTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.iceBlue,
    marginBottom: 4,
  },
  currentExLine: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
