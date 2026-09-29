import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, Pin, Search, Lock, Tag, CheckSquare, Save } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { getEffectiveToday } from '../utils/dates';
import { useSearchParams } from 'react-router-dom';
import type { Note, JournalEntry, ChecklistItem } from '../types';
import { nanoid } from 'nanoid';

const COLORS = ['', '#1e3a5f', '#1a3a2f', '#3a1a2f', '#3a2f1a', '#1a2f3a', '#2f1a3a'];
const MOODS = ['😫', '😕', '😐', '🙂', '😄'] as const;

export function NotesPage() {
  const profile = useStore(s => s.profile);
  const notes = useStore(s => s.notes);
  const journalEntries = useStore(s => s.journalEntries);
  const addNote = useStore(s => s.addNote);
  const updateNote = useStore(s => s.updateNote);
  const deleteNote = useStore(s => s.deleteNote);
  const saveJournalEntry = useStore(s => s.saveJournalEntry);
  const toast = useToast();

  const today = getEffectiveToday(profile.rolloverHour);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [tab, setTab] = useState<'notes' | 'journal'>('notes');

  // Auto-open new note from quick-note button
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingNote(null);
      setShowEditor(true);
    }
  }, [searchParams]);

  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    // Pinned first, then by updatedAt
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, search]);

  const todayJournal = journalEntries.find(e => e.date === today);

  const handleNewNote = () => {
    setEditingNote(null);
    setShowEditor(true);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 className="page-title">Notes</h1>
          <button className="btn btn-primary" onClick={handleNewNote}>
            <Plus size={16} /> New Note
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button className={`btn btn-sm ${tab === 'notes' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('notes')}>
          Notes
        </button>
        <button className={`btn btn-sm ${tab === 'journal' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab('journal')}>
          Journal
        </button>
      </div>

      {tab === 'notes' ? (
        <>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search notes"
            />
          </div>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">{search ? 'No notes found' : 'No notes yet'}</div>
              <div className="empty-state-text">Create your first note to get started!</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
              {filteredNotes.map(note => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-card"
                  style={{
                    padding: '1rem',
                    cursor: 'pointer',
                    background: note.color || undefined,
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={() => { setEditingNote(note); setShowEditor(true); }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {note.pinned && <Pin size={12} style={{ color: 'var(--color-accent)' }} />}
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title || 'Untitled'}
                    </h3>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {note.body}
                  </p>
                  {note.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {note.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="badge badge-accent" style={{ fontSize: '0.5625rem' }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <JournalSection
          today={today}
          todayJournal={todayJournal}
          onSave={saveJournalEntry}
        />
      )}

      {/* Note Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <NoteEditorModal
            note={editingNote}
            onClose={() => setShowEditor(false)}
            onSave={async (data) => {
              if (editingNote) {
                await updateNote(editingNote.id, data);
              } else {
                await addNote(data as any);
              }
              setShowEditor(false);
              toast('Note saved', 'success');
            }}
            onDelete={async (id) => {
              await deleteNote(id);
              setShowEditor(false);
              toast('Note deleted', 'info');
            }}
            onPin={async (id, pinned) => {
              await updateNote(id, { pinned });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Note Editor ─────────────────────────────────────────────────────────────

function NoteEditorModal({
  note,
  onClose,
  onSave,
  onDelete,
  onPin,
}: {
  note: Note | null;
  onClose: () => void;
  onSave: (data: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onPin: (id: string, pinned: boolean) => void;
}) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(note?.checklist ?? []);
  const [tags, setTags] = useState(note?.tags?.join(', ') ?? '');
  const [color, setColor] = useState(note?.color ?? '');
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<number>();

  // Debounced autosave
  useEffect(() => {
    if (!note) return;
    setSaved(false);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      onSave({
        title,
        body,
        checklist,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        color,
      });
      setSaved(true);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [title, body, checklist, tags, color]);

  const handleAddChecklistItem = () => {
    setChecklist(prev => [...prev, { id: nanoid(), text: '', checked: false }]);
  };

  const handleUpdateChecklistItem = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    onSave({
      title,
      body,
      checklist,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      color,
      pinned: note?.pinned ?? false,
    });
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal"
        style={{ maxWidth: '560px', maxHeight: '85vh' }}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="modal-title" style={{ marginBottom: 0 }}>{note ? 'Edit Note' : 'New Note'}</h2>
            {note && (
              <span style={{ fontSize: '0.625rem', color: saved ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                {saved ? '✓ Saved' : 'Saving...'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {note && (
              <>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onPin(note.id, !note.pinned)} title={note.pinned ? 'Unpin' : 'Pin'}>
                  <Pin size={14} style={{ color: note.pinned ? 'var(--color-accent)' : undefined }} />
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onDelete(note.id)} title="Delete">
                  <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                </button>
              </>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
          </div>
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <input
            className="input"
            placeholder="Note title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ fontWeight: 600, fontSize: '1rem' }}
          />
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <textarea
            className="input"
            placeholder="Write something..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={6}
          />
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <label className="label" style={{ marginBottom: 0 }}>Checklist</label>
            <button className="btn btn-ghost btn-sm" onClick={handleAddChecklistItem}>
              <Plus size={12} /> Add item
            </button>
          </div>
          {checklist.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => handleUpdateChecklistItem(item.id, { checked: e.target.checked })}
                style={{ accentColor: 'var(--color-accent)' }}
              />
              <input
                className="input"
                style={{ padding: '0.375rem', fontSize: '0.8125rem', textDecoration: item.checked ? 'line-through' : 'none' }}
                value={item.text}
                onChange={e => handleUpdateChecklistItem(item.id, { text: e.target.value })}
                placeholder="Checklist item..."
              />
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleRemoveChecklistItem(item.id)}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label className="label" htmlFor="note-tags">Tags (comma-separated)</label>
          <input id="note-tags" className="input" placeholder="tag1, tag2" value={tags} onChange={e => setTags(e.target.value)} />
        </div>

        {/* Color */}
        <div style={{ marginBottom: '0.75rem' }}>
          <label className="label">Color</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {COLORS.map(c => (
              <button
                key={c || 'default'}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: c || 'var(--color-bg-card)',
                  border: color === c ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onClick={() => setColor(c)}
                aria-label={c || 'Default color'}
              />
            ))}
          </div>
        </div>

        {!note && (
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              <Save size={14} /> Save Note
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Journal Section ─────────────────────────────────────────────────────────

function JournalSection({
  today,
  todayJournal,
  onSave,
}: {
  today: string;
  todayJournal?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}) {
  const [text, setText] = useState(todayJournal?.text ?? '');
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(todayJournal?.mood ?? 3);
  const [saved, setSaved] = useState(true);
  const saveTimerRef = useRef<number>();

  useEffect(() => {
    if (!todayJournal && !text) return;
    setSaved(false);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      onSave({ date: today, text, mood });
      setSaved(true);
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [text, mood]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Today's Journal</h3>
        <span style={{ fontSize: '0.625rem', color: saved ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
          {saved ? '✓ Saved' : 'Saving...'}
        </span>
      </div>

      {/* Mood */}
      <div style={{ marginBottom: '1rem' }}>
        <label className="label">How are you feeling?</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {MOODS.map((emoji, i) => (
            <button
              key={i}
              style={{
                fontSize: '1.5rem',
                background: mood === (i + 1) ? 'var(--color-bg-hover)' : 'transparent',
                border: mood === (i + 1) ? '2px solid var(--color-accent)' : '2px solid transparent',
                borderRadius: 'var(--radius-md)',
                padding: '0.375rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setMood((i + 1) as 1 | 2 | 3 | 4 | 5)}
              aria-label={`Mood ${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <textarea
        className="input"
        placeholder="Write about your day..."
        value={text}
        onChange={e => setText(e.target.value)}
        rows={6}
      />
    </motion.div>
  );
}
