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

export const StudyScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
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

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

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
          <Text style={styles.emptyTitle}>No Subjects Tracked</Text>
          <Text style={styles.emptyText}>Add topics you are studying (e.g. System Design, Calculus, French).</Text>
        </Card>
      ) : (
        subjects.map(subj => {
          const sessions = studySessions.filter(s => s.subjectId === subj.id);
          const totalMin = sessions.reduce((acc, s) => acc + s.minutes, 0);
          const targetMin = subj.weeklyTargetMin || 300;
          const pct = Math.min(100, Math.round((totalMin / targetMin) * 100));

          return (
            <Card key={subj.id} style={styles.subjectCard}>
              <View style={styles.subjectTopRow}>
                <Text style={styles.subjectName}>{subj.name}</Text>
                <Text style={styles.hoursRatio}>
                  {(totalMin / 60).toFixed(1)} / {(targetMin / 60).toFixed(0)} hrs this week
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={styles.pctText}>{pct}% of weekly target</Text>
                <Button
                  title="+ Log Session"
                  onPress={() => {
                    setSelectedSubjectId(subj.id);
                    setLogModalVisible(true);
                  }}
                  variant="secondary"
                  size="sm"
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
            <Text style={styles.modalTitle}>Add Study Subject</Text>
            <TextInput
              style={styles.input}
              placeholder="Subject name (e.g. Machine Learning)"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.fieldLabel}>WEEKLY TARGET (HOURS)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5"
              placeholderTextColor={colors.textMuted}
              value={weeklyHours}
              onChangeText={setWeeklyHours}
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
                title="Add Subject"
                onPress={handleCreateSubject}
                variant="primary"
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
            <Text style={styles.modalTitle}>Log Study Session</Text>
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
                onPress={() => setLogModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Log (+XP)"
                onPress={handleLogSession}
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
