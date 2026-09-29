import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/colors';
import { useWinterStore } from '../store/useWinterStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { GymExercise, GymPhoto } from '../types';

const SPLIT_PRESETS = ['Push Day', 'Pull Day', 'Legs', 'Upper Body', 'Full Body'];

export const GymScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const profile = useWinterStore(s => s.profile);
  const gymSessions = useWinterStore(s => s.gymSessions);
  const gymPhotos = useWinterStore(s => s.gymPhotos);
  const weightLogs = useWinterStore(s => s.weightLogs);
  const addGymSession = useWinterStore(s => s.addGymSession);
  const addGymPhoto = useWinterStore(s => s.addGymPhoto);
  const deleteGymPhoto = useWinterStore(s => s.deleteGymPhoto);
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

  // Transformation Photo state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [selectedPhotoUri, setSelectedPhotoUri] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [viewingPhoto, setViewingPhoto] = useState<GymPhoto | null>(null);

  // Compute Arc Day
  const start = new Date(profile.startDate).getTime();
  const now = new Date().getTime();
  const currentArcDay = Math.max(1, Math.min(profile.arcLength, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1));
  const latestWeight = weightLogs.length > 0 ? weightLogs[0].kg : 75.0;

  const handleAddSet = () => {
    const targetName = exerciseName.trim() || workoutName || 'Exercise';
    const r = parseInt(reps) || 10;
    const w = parseFloat(weight) || 0;

    const existingIndex = currentExercises.findIndex(
      e => e.name.toLowerCase() === targetName.toLowerCase()
    );

    if (existingIndex >= 0) {
      const updated = [...currentExercises];
      updated[existingIndex].sets.push({ reps: r, weight: w });
      setCurrentExercises(updated);
    } else {
      setCurrentExercises([
        ...currentExercises,
        {
          name: targetName,
          sets: [{ reps: r, weight: w }],
        },
      ]);
    }
    setExerciseName('');
  };

  // Single-click workout save: auto-bundles whatever is typed into the inputs without requiring "+ Add Set" first
  const handleSaveWorkout = async () => {
    let exercisesToSave = [...currentExercises];
    const nameToUse = exerciseName.trim() || (exercisesToSave.length === 0 ? workoutName || 'General Workout' : '');

    if (nameToUse) {
      const r = parseInt(reps) || 10;
      const w = parseFloat(weight) || 0;
      const existingIndex = exercisesToSave.findIndex(
        e => e.name.toLowerCase() === nameToUse.toLowerCase()
      );

      if (existingIndex >= 0) {
        exercisesToSave[existingIndex].sets.push({ reps: r, weight: w });
      } else {
        exercisesToSave.push({
          name: nameToUse,
          sets: [{ reps: r, weight: w }],
        });
      }
    }

    if (exercisesToSave.length === 0) {
      exercisesToSave = [{
        name: workoutName || 'Winter Arc Workout',
        sets: [{ reps: 10, weight: 0 }],
      }];
    }

    await addGymSession(exercisesToSave);
    setCurrentExercises([]);
    setExerciseName('');
    setModalVisible(false);
  };

  const handleSaveWeight = async () => {
    const val = parseFloat(bodyWeight);
    if (!isNaN(val) && val > 0) {
      await logWeight(val);
      setBodyWeight('');
      setWeightModalVisible(false);
    }
  };

  // Camera capture
  const handleCaptureCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to snap your transformation photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedPhotoUri(result.assets[0].uri);
        setPhotoModalVisible(true);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  // Gallery picker
  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Photo library access is required to select a transformation photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setSelectedPhotoUri(result.assets[0].uri);
        setPhotoModalVisible(true);
      }
    } catch (err) {
      console.warn('Gallery picker error:', err);
    }
  };

  // Save transformation photo
  const handleSavePhoto = async () => {
    if (!selectedPhotoUri) return;
    const today = new Date().toISOString().split('T')[0];
    await addGymPhoto({
      date: today,
      arcDay: currentArcDay,
      uri: selectedPhotoUri,
      caption: photoCaption.trim() || undefined,
      weightKg: latestWeight,
    });
    setSelectedPhotoUri(null);
    setPhotoCaption('');
    setPhotoModalVisible(false);
  };

  const handleDeletePhoto = async (id: string) => {
    await deleteGymPhoto(id);
    if (viewingPhoto?.id === id) {
      setViewingPhoto(null);
    }
  };

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Iron Discipline</Text>
          <Text style={styles.subheading}>Strength forge & physique tracking</Text>
        </View>
        <Button
          title="+ Log Workout"
          onPress={() => setModalVisible(true)}
          size="sm"
          variant="primary"
        />
      </View>

      {/* Bodyweight Tracker */}
      <Card style={styles.weightCard}>
        <View style={styles.weightRow}>
          <View>
            <Text style={styles.weightLabel}>CURRENT BODYWEIGHT</Text>
            <Text style={styles.weightVal}>{latestWeight} kg</Text>
          </View>
          <Button
            title="Log Scale"
            onPress={() => setWeightModalVisible(true)}
            size="sm"
            variant="secondary"
          />
        </View>
      </Card>

      {/* PIC OF THE DAY / TRANSFORMATION REEL */}
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>📸 TRANSFORMATION REEL</Text>
          <Text style={styles.sectionSubtitle}>Pic of the day • Day {currentArcDay} of 90</Text>
        </View>
        <View style={styles.photoActionRow}>
          <TouchableOpacity style={styles.photoActionBtn} onPress={handleCaptureCamera}>
            <Text style={styles.photoActionIcon}>📷</Text>
            <Text style={styles.photoActionText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickFromGallery}>
            <Text style={styles.photoActionIcon}>🖼️</Text>
            <Text style={styles.photoActionText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>

      {gymPhotos.length === 0 ? (
        <Card style={styles.emptyPhotoCard}>
          <Text style={styles.emptyPhotoIcon}>📸</Text>
          <Text style={styles.emptyPhotoTitle}>No Transformation Photos Yet</Text>
          <Text style={styles.emptyPhotoText}>
            Snap your Day {currentArcDay} baseline photo to witness your 90-day physical evolution.
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button
              title="📷 Snap Today's Pic"
              onPress={handleCaptureCamera}
              size="sm"
              variant="primary"
            />
            <Button
              title="🖼️ Upload Photo"
              onPress={handlePickFromGallery}
              size="sm"
              variant="secondary"
            />
          </View>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoScroll}
          contentContainerStyle={styles.photoScrollContent}
        >
          {gymPhotos.map(photo => (
            <TouchableOpacity
              key={photo.id}
              style={styles.photoThumbCard}
              onPress={() => setViewingPhoto(photo)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: photo.uri }} style={styles.photoImage} />
              <View style={styles.photoOverlayBadge}>
                <Text style={styles.photoDayText}>DAY {photo.arcDay}</Text>
              </View>
              {photo.weightKg && (
                <View style={styles.photoWeightBadge}>
                  <Text style={styles.photoWeightText}>{photo.weightKg} kg</Text>
                </View>
              )}
              <View style={styles.photoDateBar}>
                <Text style={styles.photoDateText}>{photo.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Workout Split Presets */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>WORKOUT PRESETS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
        {SPLIT_PRESETS.map(split => (
          <TouchableOpacity
            key={split}
            style={styles.splitPill}
            onPress={() => {
              setWorkoutName(split);
              setExerciseName(split);
              setModalVisible(true);
            }}
          >
            <Text style={styles.splitText}>{split} +</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Workout History */}
      <Text style={styles.sectionTitle}>RECENT GYM SESSIONS</Text>
      {gymSessions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>No workouts recorded yet. Hit the gym and log your sets!</Text>
        </Card>
      ) : (
        gymSessions.map(session => (
          <Card key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionDate}>📅 {session.date}</Text>
              <Text style={styles.sessionXp}>+50 XP</Text>
            </View>

            {session.exercises.map((ex, idx) => (
              <View key={idx} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>🏋️ {ex.name}</Text>
                <View style={styles.setRow}>
                  {ex.sets.map((s, sIdx) => (
                    <Text key={sIdx} style={styles.setTag}>
                      {s.weight > 0 ? `${s.weight}kg × ` : ''}{s.reps} reps
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </Card>
        ))
      )}

      {/* 1-Click Workout Logging Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Gym Session</Text>
            <Text style={styles.modalSub}>
              Enter your exercise and click <Text style={{ color: colors.mintSuccess, fontWeight: '700' }}>Save Workout</Text> once to record it immediately (+50 XP).
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Exercise name (e.g. Barbell Bench Press)"
              placeholderTextColor={colors.textMuted}
              value={exerciseName}
              onChangeText={setExerciseName}
            />

            <View style={styles.inputsRow}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.fieldLabel}>WEIGHT (KG)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 80"
                  placeholderTextColor={colors.textMuted}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.fieldLabel}>REPS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 10"
                  placeholderTextColor={colors.textMuted}
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Button
              title="+ Add Another Set"
              onPress={handleAddSet}
              variant="secondary"
              size="sm"
              style={{ marginBottom: spacing.md }}
            />

            {/* Current exercise summary */}
            {currentExercises.length > 0 && (
              <View style={styles.currentExBox}>
                <Text style={styles.currentExTitle}>Logged Sets This Session:</Text>
                {currentExercises.map((e, i) => (
                  <Text key={i} style={styles.currentExLine}>
                    • {e.name}: {e.sets.length} sets
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
                title="Save Workout (+50 XP)"
                variant="primary"
                onPress={handleSaveWorkout}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Preview & Caption Save Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Pic of the Day</Text>
            <Text style={styles.modalSub}>Day {currentArcDay} Transformation Photo</Text>

            {selectedPhotoUri && (
              <Image source={{ uri: selectedPhotoUri }} style={styles.modalPhotoPreview} />
            )}

            <TextInput
              style={styles.input}
              placeholder="Caption (e.g. Chest pump baseline, feeling strong)"
              placeholderTextColor={colors.textMuted}
              value={photoCaption}
              onChangeText={setPhotoCaption}
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => {
                  setSelectedPhotoUri(null);
                  setPhotoModalVisible(false);
                }}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Photo (+15 XP)"
                variant="primary"
                onPress={handleSavePhoto}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Full Photo Inspection Modal */}
      <Modal
        visible={!!viewingPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setViewingPhoto(null)}
      >
        <View style={styles.fullPhotoOverlay}>
          <View style={styles.fullPhotoHeader}>
            <View>
              <Text style={styles.fullPhotoDay}>DAY {viewingPhoto?.arcDay} • {viewingPhoto?.date}</Text>
              {viewingPhoto?.weightKg && (
                <Text style={styles.fullPhotoWeight}>Weight: {viewingPhoto.weightKg} kg</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setViewingPhoto(null)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {viewingPhoto && (
            <Image
              source={{ uri: viewingPhoto.uri }}
              style={styles.fullPhotoImage}
              resizeMode="contain"
            />
          )}

          {viewingPhoto?.caption ? (
            <Text style={styles.fullPhotoCaption}>{viewingPhoto.caption}</Text>
          ) : null}

          <View style={styles.fullPhotoActions}>
            <Button
              title="Delete Photo"
              variant="danger"
              size="sm"
              onPress={() => viewingPhoto && handleDeletePhoto(viewingPhoto.id)}
            />
          </View>
        </View>
      </Modal>

      {/* Log Weight Modal */}
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
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
    },
    photoActionRow: {
      flexDirection: 'row',
      gap: 6,
    },
    photoActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.cardElevated,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.borderActive,
    },
    photoActionIcon: {
      fontSize: 12,
    },
    photoActionText: {
      fontSize: 11,
      color: colors.iceBlue,
      fontWeight: '700',
    },
    emptyPhotoCard: {
      alignItems: 'center',
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderStyle: 'dashed',
      borderWidth: 1.5,
      borderColor: colors.borderActive,
    },
    emptyPhotoIcon: {
      fontSize: 28,
      marginBottom: 6,
    },
    emptyPhotoTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.iceBlue,
      marginBottom: 4,
    },
    emptyPhotoText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 16,
    },
    photoScroll: {
      marginBottom: spacing.md,
    },
    photoScrollContent: {
      gap: 10,
      paddingVertical: 4,
    },
    photoThumbCard: {
      width: 120,
      height: 160,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.borderActive,
      backgroundColor: colors.cardBg,
      position: 'relative',
    },
    photoImage: {
      width: '100%',
      height: '100%',
    },
    photoOverlayBadge: {
      position: 'absolute',
      top: 6,
      left: 6,
      backgroundColor: 'rgba(5, 15, 30, 0.85)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.iceBlue,
    },
    photoDayText: {
      fontSize: 9,
      fontWeight: '900',
      color: colors.iceBlue,
      letterSpacing: 0.5,
    },
    photoWeightBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: 'rgba(0, 217, 127, 0.85)',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4,
    },
    photoWeightText: {
      fontSize: 9,
      fontWeight: '900',
      color: '#041f12',
    },
    photoDateBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      paddingVertical: 4,
      alignItems: 'center',
    },
    photoDateText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalPhotoPreview: {
      width: '100%',
      height: 200,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      resizeMode: 'cover',
    },
    fullPhotoOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    fullPhotoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 30,
    },
    fullPhotoDay: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.iceBlue,
    },
    fullPhotoWeight: {
      fontSize: 12,
      color: colors.mintSuccess,
      fontWeight: '700',
      marginTop: 2,
    },
    closeBtn: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: 20,
    },
    closeBtnText: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '800',
    },
    fullPhotoImage: {
      width: '100%',
      flex: 1,
      marginVertical: spacing.md,
    },
    fullPhotoCaption: {
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.md,
      fontStyle: 'italic',
    },
    fullPhotoActions: {
      paddingBottom: 20,
      alignItems: 'center',
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
      borderTopColor: colors.border,
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
      marginBottom: 4,
    },
    modalSub: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: spacing.md,
      lineHeight: 16,
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
