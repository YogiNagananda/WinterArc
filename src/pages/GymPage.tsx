import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Dumbbell, TrendingUp, Trophy, Scale } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { getEffectiveToday, formatDate } from '../utils/dates';
import type { GymSession, GymExercise, GymSet } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const DEFAULT_SPLIT = [
  { day: 1, label: 'Push' }, { day: 2, label: 'Pull' }, { day: 3, label: 'Legs' },
  { day: 4, label: 'Push' }, { day: 5, label: 'Pull' }, { day: 6, label: 'Legs' },
  { day: 0, label: 'Rest' },
];

export function GymPage() {
  const profile = useStore(s => s.profile);
  const gymSessions = useStore(s => s.gymSessions);
  const bodyWeightLogs = useStore(s => s.bodyWeightLogs);
  const addGymSession = useStore(s => s.addGymSession);
  const deleteGymSession = useStore(s => s.deleteGymSession);
  const addBodyWeightLog = useStore(s => s.addBodyWeightLog);
  const toast = useToast();

  const today = getEffectiveToday(profile.rolloverHour);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'log' | 'history' | 'weight'>('log');
  const [weightInput, setWeightInput] = useState('');

  // Workout streak
  const workoutStreak = useMemo(() => {
    const dates = [...new Set(gymSessions.map(s => s.date))].sort().reverse();
    let streak = 0;
    for (const d of dates) {
      streak++;
      // Check for gaps (we count any logged day)
    }
    return streak;
  }, [gymSessions]);

  // Last session for each exercise (for reference while logging)
  const lastSessionExercises = useMemo(() => {
    const sorted = [...gymSessions].sort((a, b) => b.date.localeCompare(a.date));
    const map = new Map<string, GymSet[]>();
    for (const session of sorted) {
      for (const ex of session.exercises) {
        if (!map.has(ex.name)) {
          map.set(ex.name, ex.sets);
        }
      }
    }
    return map;
  }, [gymSessions]);

  const handleLogWeight = async () => {
    const kg = parseFloat(weightInput);
    if (isNaN(kg) || kg <= 0) { toast('Enter a valid weight', 'error'); return; }
    await addBodyWeightLog({ date: today, kg });
    setWeightInput('');
    toast('Weight logged', 'success');
  };

  const weightChartData = useMemo(() =>
    [...bodyWeightLogs]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => ({ date: l.date, kg: l.kg })),
    [bodyWeightLogs]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Gym Tracker</h1>
            <p className="page-subtitle">Track workouts & progress</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Log Workout
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <Dumbbell size={20} style={{ color: 'var(--color-accent)', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{gymSessions.length}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Total Workouts</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
          <Trophy size={20} style={{ color: 'var(--color-streak)', marginBottom: '0.25rem' }} />
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{workoutStreak}</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Workout Streak</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['log', 'history', 'weight'] as const).map(t => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'history' && (
        gymSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏋️</div>
            <div className="empty-state-title">No workouts logged</div>
            <div className="empty-state-text">Log your first workout to start tracking!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...gymSessions].sort((a, b) => b.date.localeCompare(a.date)).map(session => (
              <motion.div key={session.id} layout className="glass-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{format(new Date(session.date), 'EEE, MMM d')}</span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { deleteGymSession(session.id); toast('Deleted', 'info'); }}>
                    <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                  </button>
                </div>
                {session.exercises.map((ex, i) => (
                  <div key={i} style={{ marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{ex.name}</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
                      {ex.sets.map((set, j) => (
                        <span key={j} style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                          {set.reps}×{set.weight}kg
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        )
      )}

      {tab === 'weight' && (
        <div>
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Log Body Weight</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                type="number"
                step="0.1"
                placeholder="Weight (kg)"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleLogWeight}>
                <Scale size={14} /> Log
              </button>
            </div>
          </div>

          {weightChartData.length > 1 && (
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Weight Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightChartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.75rem' }} />
                  <Line type="monotone" dataKey="kg" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--color-accent)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {tab === 'log' && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.5rem' }}>Today's Split</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Log a workout to track your exercises, sets, reps, and weights.
          </p>
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={() => setShowForm(true)}>
            <Plus size={14} /> Log Workout
          </button>
        </div>
      )}

      {/* Workout Form Modal */}
      <AnimatePresence>
        {showForm && (
          <WorkoutFormModal
            lastExercises={lastSessionExercises}
            onClose={() => setShowForm(false)}
            onSave={async (exercises) => {
              await addGymSession({ date: today, exercises });
              setShowForm(false);
              toast('Workout logged! 💪', 'success');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Workout Form ────────────────────────────────────────────────────────────

function WorkoutFormModal({
  lastExercises,
  onClose,
  onSave,
}: {
  lastExercises: Map<string, GymSet[]>;
  onClose: () => void;
  onSave: (exercises: GymExercise[]) => void;
}) {
  const [exercises, setExercises] = useState<GymExercise[]>([
    { name: '', sets: [{ reps: 0, weight: 0 }] },
  ]);

  const addExercise = () => {
    setExercises(prev => [...prev, { name: '', sets: [{ reps: 0, weight: 0 }] }]);
  };

  const updateExercise = (idx: number, name: string) => {
    setExercises(prev => prev.map((e, i) => i === idx ? { ...e, name } : e));
  };

  const addSet = (exIdx: number) => {
    setExercises(prev => prev.map((e, i) =>
      i === exIdx ? { ...e, sets: [...e.sets, { reps: 0, weight: 0 }] } : e
    ));
  };

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight', value: number) => {
    setExercises(prev => prev.map((e, i) =>
      i === exIdx ? {
        ...e,
        sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s),
      } : e
    ));
  };

  const removeExercise = (idx: number) => {
    setExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const valid = exercises.filter(e => e.name.trim());
    if (valid.length === 0) return;
    onSave(valid);
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" style={{ maxWidth: '520px' }} initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>Log Workout</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {exercises.map((ex, exIdx) => {
          const lastSets = lastExercises.get(ex.name);
          return (
            <div key={exIdx} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg-glass)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  className="input"
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={e => updateExercise(exIdx, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeExercise(exIdx)}>
                  <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                </button>
              </div>
              {lastSets && (
                <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>
                  Last: {lastSets.map((s, i) => `${s.reps}×${s.weight}kg`).join(', ')}
                </div>
              )}
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', width: '1.5rem' }}>S{setIdx + 1}</span>
                  <input className="input" type="number" placeholder="Reps" value={set.reps || ''} onChange={e => updateSet(exIdx, setIdx, 'reps', Number(e.target.value))} style={{ width: '70px' }} />
                  <span style={{ fontSize: '0.6875rem' }}>×</span>
                  <input className="input" type="number" placeholder="kg" value={set.weight || ''} onChange={e => updateSet(exIdx, setIdx, 'weight', Number(e.target.value))} style={{ width: '70px' }} />
                  <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>kg</span>
                </div>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={() => addSet(exIdx)}>
                <Plus size={12} /> Add Set
              </button>
            </div>
          );
        })}

        <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '1rem' }} onClick={addExercise}>
          <Plus size={14} /> Add Exercise
        </button>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>Save Workout</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
