import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const StudyScreen: React.FC = () => {
  const subjects = useWinterStore(s => s.studySubjects);
  const studySessions = useWinterStore(s => s.studySessions);
  const addSubject = useWinterStore(s => s.addSubject);
  const addStudySession = useWinterStore(s => s.addStudySession);

  const [modalVisible, setModalVisible] = useState(false);
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('5');

  // Session log
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState('45');

  const handleCreateSubject = async () => {
    if (!name.trim()) return;
    const min = (parseFloat(weeklyHours) || 5) * 60;
    await addSubject(name.trim(), min);
    setName('');
    setModalVisible(false);
  };

  const handleLogSession = async () => {
    if (!selectedSubjectId) return;
    const min = parseInt(sessionMinutes) || 30;
    await addStudySession(selectedSubjectId, min);
    setLogModalVisible(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Deep Study & Skill Arc</Text>
          <Text style={styles.subheading}>Master hard skills through dedicated weekly hours</Text>
        </View>
        <Button
          title="+ Add Subject"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      {subjects.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No study tracks created</Text>
          <Text style={styles.emptyText}>Add topics you want to conquer: Coding, Math, Languages, etc.</Text>
          <Button
            title="Create Subject"
            onPress={() => setModalVisible(true)}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        </Card>
      ) : (
        subjects.map(subject => {
          // Calculate logged minutes
          const loggedMin = studySessions
            .filter(s => s.subjectId === subject.id)
            .reduce((sum, s) => sum + s.minutes, 0);

          const targetMin = subject.weeklyTargetMin || 300;
          const pct = Math.min(100, Math.round((loggedMin / targetMin) * 100));

          return (
            <Card key={subject.id} elevated style={styles.subjectCard}>
              <View style={styles.subjectTopRow}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.hoursRatio}>
                  {(loggedMin / 60).toFixed(1)}h / {(targetMin / 60).toFixed(1)}h
                </Text>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={styles.pctText}>{pct}% of weekly target</Text>
                <Button
                  title="+ Log Study"
                  onPress={() => {
                    setSelectedSubjectId(subject.id);
                    setLogModalVisible(true);
                  }}
                  size="sm"
                  variant="secondary"
                />
              </View>
            </Card>
          );
        })
      )}

      {/* Add Subject Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Study Track</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject Name (e.g. Distributed Systems, Calculus)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.fieldLabel}>WEEKLY TARGET (HOURS)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 6"
              placeholderTextColor={colors.textMuted}
              value={weeklyHours}
              onChangeText={setWeeklyHours}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Subject"
                variant="primary"
                onPress={handleCreateSubject}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Log Session Modal */}
      <Modal
        visible={logModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Study Time</Text>
            <Text style={styles.fieldLabel}>DURATION (MINUTES)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 45"
              placeholderTextColor={colors.textMuted}
              value={sessionMinutes}
              onChangeText={setSessionMinutes}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setLogModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm (+XP)"
                variant="success"
                onPress={handleLogSession}
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
  subjectCard: {
    marginBottom: spacing.md,
  },
  subjectTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hoursRatio: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.iceBlue,
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
    backgroundColor: colors.iceBlue,
    borderRadius: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pctText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '700',
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
