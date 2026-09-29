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
import { Priority, RepeatType } from '../types';

const CATEGORIES = ['All', 'Gym', 'Study', 'Health', 'Work', 'Personal'];

export const TasksScreen: React.FC = () => {
  const { colors, spacing, borderRadius } = useTheme();
  const tasks = useWinterStore(s => s.tasks);
  const completions = useWinterStore(s => s.completions);
  const toggleTaskCompletion = useWinterStore(s => s.toggleTaskCompletion);
  const addTask = useWinterStore(s => s.addTask);
  const deleteTask = useWinterStore(s => s.deleteTask);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Gym');
  const [priority, setPriority] = useState<Priority>('medium');
  const [durationMin, setDurationMin] = useState('30');
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [xp, setXp] = useState('20');

  const today = new Date().toISOString().split('T')[0];
  const todayCompletedIds = new Set(
    completions.filter(c => c.date === today).map(c => c.taskId)
  );

  const filteredTasks = tasks.filter(t => {
    if (t.archived) return false;
    if (selectedCategory === 'All') return true;
    return t.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    await addTask({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      startDate: today,
      startTime: '',
      durationMin: parseInt(durationMin) || 30,
      repeatType,
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      reminder: 'none',
      xp: parseInt(xp) || 20,
    });

    setTitle('');
    setDescription('');
    setModalVisible(false);
  };

  const getPriorityStyle = (prio: Priority) => {
    switch (prio) {
      case 'high':
        return { color: colors.dangerCoral, borderColor: colors.dangerCoral };
      case 'low':
        return { color: colors.textMuted, borderColor: colors.border };
      default:
        return { color: colors.amberWarning, borderColor: colors.amberWarning };
    }
  };

  const styles = useMemo(() => createStyles(colors, spacing, borderRadius), [colors, spacing, borderRadius]);

  return (
    <View style={styles.container}>
      {/* Category Pills Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}
      >
        {CATEGORIES.map(cat => {
          const isActive = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, isActive && styles.catTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Task List */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>Non-Negotiables</Text>
            <Text style={styles.subheading}>
              {filteredTasks.filter(t => todayCompletedIds.has(t.id)).length} of {filteredTasks.length} completed today
            </Text>
          </View>
          <Button
            title="+ New Task"
            onPress={() => setModalVisible(true)}
            size="sm"
            variant="primary"
          />
        </View>

        {filteredTasks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No tasks in this category</Text>
            <Text style={styles.emptyText}>Add daily habits and non-negotiables to dominate your 90-day arc.</Text>
          </Card>
        ) : (
          filteredTasks.map(task => {
            const isDone = todayCompletedIds.has(task.id);
            const prioStyle = getPriorityStyle(task.priority);

            return (
              <Card
                key={task.id}
                style={[styles.taskCard, isDone && styles.taskCardDone]}
              >
                <TouchableOpacity
                  style={styles.taskTouch}
                  onPress={() => toggleTaskCompletion(task.id, today)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                    {isDone && <Text style={styles.checkMark}>✓</Text>}
                  </View>

                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text style={styles.taskDesc}>{task.description}</Text>
                    ) : null}

                    <View style={styles.metaRow}>
                      <View style={[styles.prioTag, { borderColor: prioStyle.borderColor }]}>
                        <Text style={[styles.prioText, { color: prioStyle.color }]}>
                          {task.priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.metaBadge}>{task.category}</Text>
                      <Text style={styles.metaBadge}>{task.durationMin}m</Text>
                      <Text style={styles.xpTag}>+{task.xp} XP</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => deleteTask(task.id)}
                  >
                    <Text style={styles.deleteText}>✕</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Create Task Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Daily Habit / Task</Text>

            <TextInput
              style={styles.input}
              placeholder="Task title (e.g. Cold Shower, 100 Pushups)"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Description or notes (optional)"
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
            />

            {/* Category Selector */}
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.radioRow}>
              {['Gym', 'Study', 'Health', 'Work', 'Personal'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.radioPill, category === c && styles.radioPillActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.radioText, category === c && styles.radioTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selector */}
            <Text style={styles.fieldLabel}>PRIORITY</Text>
            <View style={styles.radioRow}>
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[styles.radioPill, priority === p && styles.radioPillActive]}
                  onPress={() => setPriority(p)}
                >
                  <Text style={[styles.radioText, priority === p && styles.radioTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="secondary"
                style={{ flex: 1 }}
              />
              <Button
                title="Create Habit"
                onPress={handleCreate}
                variant="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (colors: any, spacing: any, borderRadius: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    categoryBar: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.bgSecondary,
    },
    catPill: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: borderRadius.full,
      backgroundColor: colors.cardBg,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    catPillActive: {
      backgroundColor: colors.iceBlueSubtle,
      borderColor: colors.iceBlue,
    },
    catText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    catTextActive: {
      color: colors.iceBlue,
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
    taskCard: {
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    taskCardDone: {
      backgroundColor: colors.mintSubtle,
      borderColor: 'rgba(0, 217, 127, 0.3)',
    },
    taskTouch: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 7,
      borderWidth: 2,
      borderColor: colors.borderActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      marginTop: 2,
    },
    checkboxDone: {
      backgroundColor: colors.mintSuccess,
      borderColor: colors.mintSuccess,
    },
    checkMark: {
      color: '#082519',
      fontWeight: '900',
      fontSize: 14,
    },
    taskInfo: {
      flex: 1,
    },
    taskTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    taskTitleDone: {
      textDecorationLine: 'line-through',
      color: colors.textMuted,
    },
    taskDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      gap: 6,
      flexWrap: 'wrap',
    },
    prioTag: {
      borderWidth: 1,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    prioText: {
      fontSize: 9,
      fontWeight: '800',
    },
    metaBadge: {
      fontSize: 10,
      color: colors.textMuted,
      backgroundColor: colors.cardElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontWeight: '600',
    },
    xpTag: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.mintSuccess,
    },
    deleteBtn: {
      padding: 6,
      marginLeft: 6,
    },
    deleteText: {
      color: colors.textMuted,
      fontSize: 14,
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
    radioRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: spacing.lg,
    },
    radioPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: colors.cardBg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    radioPillActive: {
      backgroundColor: colors.iceBlueSubtle,
      borderColor: colors.iceBlue,
    },
    radioText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    radioTextActive: {
      color: colors.iceBlue,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
    },
  });
