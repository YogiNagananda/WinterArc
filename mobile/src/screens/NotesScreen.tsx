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
import { Note } from '../types';

const NOTE_COLORS = ['#1a2644', '#0f2644', '#1a2635', '#16243a', '#1e1a44'];

export const NotesScreen: React.FC = () => {
  const notes = useWinterStore(s => s.notes);
  const saveNote = useWinterStore(s => s.saveNote);
  const deleteNote = useWinterStore(s => s.deleteNote);
  const journalEntries = useWinterStore(s => s.journalEntries);
  const saveJournalEntry = useWinterStore(s => s.saveJournalEntry);

  const [activeTab, setActiveTab] = useState<'notes' | 'journal'>('notes');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);

  // Journal
  const [journalModalVisible, setJournalModalVisible] = useState(false);
  const [journalText, setJournalText] = useState('');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = journalEntries.find(e => e.date === today);

  const openNoteEditor = (note?: Note) => {
    setEditingNote(note || null);
    setNoteTitle(note?.title || '');
    setNoteBody(note?.body || '');
    setNoteColor(note?.color || NOTE_COLORS[0]);
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    await saveNote({
      id: editingNote?.id,
      title: noteTitle.trim(),
      body: noteBody.trim(),
      color: noteColor,
    });
    setNoteModalVisible(false);
  };

  const handleSaveJournal = async () => {
    await saveJournalEntry(journalText.trim(), mood);
    setJournalModalVisible(false);
  };

  const MOOD_EMOJIS: Record<number, string> = {
    1: '😔',
    2: '😐',
    3: '🙂',
    4: '😄',
    5: '🔥',
  };

  return (
    <View style={styles.container}>
      {/* Tab switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
            📝 Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journal' && styles.tabActive]}
          onPress={() => setActiveTab('journal')}
        >
          <Text style={[styles.tabText, activeTab === 'journal' && styles.tabTextActive]}>
            📔 Journal
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'notes' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Notes & Non-Negotiables</Text>
            <Button
              title="+ Note"
              onPress={() => openNoteEditor()}
              size="sm"
              variant="primary"
            />
          </View>

          {notes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No notes yet. Write your non-negotiables, manifesto, or study notes here.
              </Text>
            </Card>
          ) : (
            notes.map(note => (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.8}
                onPress={() => openNoteEditor(note)}
              >
                <View style={[styles.noteCard, { backgroundColor: note.color || NOTE_COLORS[0] }]}>
                  {note.pinned && <Text style={styles.pinnedTag}>📌 Pinned</Text>}
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {note.title || 'Untitled Note'}
                  </Text>
                  <Text style={styles.noteBody} numberOfLines={3}>
                    {note.body}
                  </Text>
                  {note.checklist.length > 0 && (
                    <Text style={styles.checklistHint}>
                      ✓ {note.checklist.filter(c => c.checked).length}/{note.checklist.length} checked
                    </Text>
                  )}
                  <View style={styles.noteFooter}>
                    <View style={styles.tagRow}>
                      {note.tags.slice(0, 3).map(tag => (
                        <Text key={tag} style={styles.noteTag}>{tag}</Text>
                      ))}
                    </View>
                    <TouchableOpacity onPress={() => deleteNote(note.id)}>
                      <Text style={styles.deleteText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.heading}>Daily Reflection</Text>
            <Button
              title={todayEntry ? 'Edit Today' : '+ Write Today'}
              onPress={() => {
                setJournalText(todayEntry?.text || '');
                setMood(todayEntry?.mood || 3);
                setJournalModalVisible(true);
              }}
              size="sm"
              variant="primary"
            />
          </View>

          {todayEntry && (
            <Card elevated style={styles.todayJournal}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalDate}>Today — {todayEntry.date}</Text>
                <Text style={styles.journalMood}>{MOOD_EMOJIS[todayEntry.mood]}</Text>
              </View>
              <Text style={styles.journalText}>{todayEntry.text}</Text>
            </Card>
          )}

          {journalEntries.filter(e => e.date !== today).map(entry => (
            <Card key={entry.date} style={styles.journalHistoryCard}>
              <View style={styles.journalHeader}>
                <Text style={styles.journalHistoryDate}>{entry.date}</Text>
                <Text style={styles.journalMoodSmall}>{MOOD_EMOJIS[entry.mood]}</Text>
              </View>
              <Text style={styles.journalHistoryText} numberOfLines={2}>
                {entry.text}
              </Text>
            </Card>
          ))}
        </ScrollView>
      )}

      {/* Note Editor Modal */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingNote ? 'Edit Note' : 'New Note'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Note title (e.g. Non-Negotiables, Study Plan)"
              placeholderTextColor={colors.textMuted}
              value={noteTitle}
              onChangeText={setNoteTitle}
            />

            <TextInput
              style={[styles.input, styles.bodyInput]}
              placeholder="Write your thoughts, plans, or rules here..."
              placeholderTextColor={colors.textMuted}
              value={noteBody}
              onChangeText={setNoteBody}
              multiline
            />

            {/* Color picker */}
            <Text style={styles.fieldLabel}>NOTE COLOR</Text>
            <View style={styles.colorRow}>
              {NOTE_COLORS.map(col => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorDot,
                    { backgroundColor: col },
                    noteColor === col && styles.colorDotSelected,
                  ]}
                  onPress={() => setNoteColor(col)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setNoteModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Note"
                variant="primary"
                onPress={handleSaveNote}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Journal Modal */}
      <Modal
        visible={journalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setJournalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Reflection — {today}</Text>

            <Text style={styles.fieldLabel}>TODAY'S MOOD</Text>
            <View style={styles.moodRow}>
              {([1, 2, 3, 4, 5] as (1 | 2 | 3 | 4 | 5)[]).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.moodBtn, mood === m && styles.moodBtnActive]}
                  onPress={() => setMood(m)}
                >
                  <Text style={styles.moodEmoji}>{MOOD_EMOJIS[m]}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { height: 120 }]}
              placeholder="What did you accomplish today? What could be better tomorrow?"
              placeholderTextColor={colors.textMuted}
              value={journalText}
              onChangeText={setJournalText}
              multiline
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setJournalModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Reflection"
                variant="primary"
                onPress={handleSaveJournal}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.iceBlue,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabTextActive: {
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
    fontSize: 16,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  noteCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinnedTag: {
    fontSize: 11,
    color: colors.amberWarning,
    fontWeight: '700',
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  noteBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  checklistHint: {
    fontSize: 11,
    color: colors.mintSuccess,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  noteTag: {
    fontSize: 11,
    color: colors.iceBlue,
    backgroundColor: colors.iceBlueSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '700',
  },
  deleteText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  // Journal
  todayJournal: {
    borderLeftWidth: 3,
    borderLeftColor: colors.iceBlue,
    marginBottom: spacing.lg,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.iceBlue,
  },
  journalMood: {
    fontSize: 22,
  },
  journalText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  journalHistoryCard: {
    marginBottom: spacing.sm,
  },
  journalHistoryDate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  journalMoodSmall: {
    fontSize: 16,
  },
  journalHistoryText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  // Modal
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
  bodyInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    marginBottom: 8,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.lg,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotSelected: {
    borderColor: colors.iceBlue,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  moodBtn: {
    padding: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodBtnActive: {
    backgroundColor: colors.iceBlueSubtle,
    borderColor: colors.iceBlue,
  },
  moodEmoji: {
    fontSize: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
});
