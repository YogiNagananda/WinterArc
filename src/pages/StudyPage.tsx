import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, BookOpen, Clock } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { getEffectiveToday, formatMinutes } from '../utils/dates';
import type { Subject, StudySession } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export function StudyPage() {
  const profile = useStore(s => s.profile);
  const subjects = useStore(s => s.subjects);
  const studySessions = useStore(s => s.studySessions);
  const addSubject = useStore(s => s.addSubject);
  const archiveSubject = useStore(s => s.archiveSubject);
  const addStudySession = useStore(s => s.addStudySession);
  const deleteStudySession = useStore(s => s.deleteStudySession);
  const toast = useToast();

  const today = getEffectiveToday(profile.rolloverHour);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(300);
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionMinutes, setSessionMinutes] = useState(30);

  const activeSubjects = useMemo(() => subjects.filter(s => !s.archived), [subjects]);

  // Weekly hours per subject
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  const weeklyData = useMemo(() => {
    const weekSessions = studySessions.filter(s => {
      const d = new Date(s.date);
      return isWithinInterval(d, { start: weekStart, end: weekEnd });
    });

    return activeSubjects.map(sub => {
      const mins = weekSessions
        .filter(s => s.subjectId === sub.id)
        .reduce((sum, s) => sum + s.minutes, 0);
      return { name: sub.name, minutes: mins, target: sub.weeklyTargetMin };
    });
  }, [activeSubjects, studySessions, weekStart, weekEnd]);

  const totalStudyMin = studySessions.reduce((sum, s) => sum + s.minutes, 0);

  const handleAddSubject = async () => {
    if (!subjectName.trim()) return;
    await addSubject({ name: subjectName.trim(), weeklyTargetMin: weeklyTarget });
    setSubjectName('');
    setShowSubjectForm(false);
    toast('Subject added', 'success');
  };

  const handleLogSession = async () => {
    if (!sessionSubject) { toast('Select a subject', 'error'); return; }
    await addStudySession({ subjectId: sessionSubject, date: today, minutes: sessionMinutes });
    setShowSessionForm(false);
    toast(`${sessionMinutes} min logged!`, 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Study Tracker</h1>
            <p className="page-subtitle">Track your learning progress</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setShowSubjectForm(true)}>
              <Plus size={14} /> Subject
            </button>
            <button className="btn btn-primary" onClick={() => setShowSessionForm(true)}>
              <Clock size={14} /> Log Session
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <BookOpen size={20} style={{ color: 'var(--color-accent)', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{formatMinutes(totalStudyMin)}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Total Study Time</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <Clock size={20} style={{ color: 'var(--color-xp)', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{studySessions.length}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Sessions</div>
        </div>
      </div>

      {/* Weekly Chart */}
      {weeklyData.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>This Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.75rem' }} />
              <Bar dataKey="minutes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Subjects */}
      <div className="glass-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Subjects</h3>
        {activeSubjects.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Add a subject to start tracking your study sessions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {activeSubjects.map(sub => {
              const weekMins = weeklyData.find(d => d.name === sub.name)?.minutes ?? 0;
              const progress = Math.min(100, Math.round((weekMins / sub.weeklyTargetMin) * 100));
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-glass)' }}>
                  <BookOpen size={16} style={{ color: 'var(--color-accent)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{sub.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'var(--color-border)' }}>
                        <div style={{ width: `${progress}%`, height: '100%', borderRadius: '2px', background: 'var(--gradient-accent)' }} />
                      </div>
                      <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>
                        {formatMinutes(weekMins)}/{formatMinutes(sub.weeklyTargetMin)}
                      </span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { archiveSubject(sub.id); toast('Archived', 'info'); }}>
                    <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Subject Modal */}
      <AnimatePresence>
        {showSubjectForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSubjectForm(false)}>
            <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Add Subject</h2>
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="label">Name *</label>
                <input className="input" value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="label">Weekly Target (minutes)</label>
                <input className="input" type="number" value={weeklyTarget} onChange={e => setWeeklyTarget(Number(e.target.value))} />
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowSubjectForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddSubject}>Add</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Session Modal */}
      <AnimatePresence>
        {showSessionForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSessionForm(false)}>
            <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <h2 className="modal-title">Log Study Session</h2>
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="label">Subject</label>
                <select className="input" value={sessionSubject} onChange={e => setSessionSubject(e.target.value)}>
                  <option value="">Select...</option>
                  {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="label">Duration (minutes)</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[15, 25, 30, 45, 60, 90, 120].map(m => (
                    <button key={m} type="button" className={`btn btn-sm ${sessionMinutes === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setSessionMinutes(m)}>
                      {formatMinutes(m)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowSessionForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleLogSession}>Log</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
