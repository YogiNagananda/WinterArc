import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Check, Edit2, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { getEffectiveToday } from '../utils/dates';
import { goalPresets, createGoalFromPreset } from '../data/presets';
import type { Goal, GoalType } from '../types';

export function GoalsPage() {
  const profile = useStore(s => s.profile);
  const goals = useStore(s => s.goals);
  const goalLogs = useStore(s => s.goalLogs);
  const addGoal = useStore(s => s.addGoal);
  const updateGoal = useStore(s => s.updateGoal);
  const archiveGoal = useStore(s => s.archiveGoal);
  const updateGoalLog = useStore(s => s.updateGoalLog);
  const toast = useToast();

  const today = getEffectiveToday(profile.rolloverHour);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const activeGoals = useMemo(() => goals.filter(g => !g.archived), [goals]);

  const todayLogs = useMemo(() => {
    const map = new Map<string, number>();
    goalLogs.filter(l => l.date === today).forEach(l => map.set(l.goalId, l.value));
    return map;
  }, [goalLogs, today]);

  const handleIncrement = async (goal: Goal) => {
    const current = todayLogs.get(goal.id) ?? 0;
    const newVal = Math.min(current + goal.step, goal.target * 2);
    await updateGoalLog(goal.id, today, newVal);
    if (newVal >= goal.target && current < goal.target) {
      toast(`Goal completed: ${goal.title}! +15 XP ⭐`, 'success');
    }
  };

  const handleDecrement = async (goal: Goal) => {
    const current = todayLogs.get(goal.id) ?? 0;
    const newVal = Math.max(0, current - goal.step);
    await updateGoalLog(goal.id, today, newVal);
  };

  const handleCheckbox = async (goal: Goal) => {
    const current = todayLogs.get(goal.id) ?? 0;
    const newVal = current >= 1 ? 0 : 1;
    await updateGoalLog(goal.id, today, newVal);
    if (newVal >= 1) {
      toast(`Goal completed: ${goal.title}! +15 XP ⭐`, 'success');
    }
  };

  const handleAddPreset = async (preset: typeof goalPresets[number]) => {
    const goal = createGoalFromPreset(preset);
    await addGoal(goal);
    toast(`Added ${preset.title} goal`, 'success');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Daily Goals</h1>
            <p className="page-subtitle">Track your daily habits</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setShowForm(true); }}>
            <Plus size={16} /> Add Goal
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      {activeGoals.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Quick Start – Add a Preset</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {goalPresets.map(preset => (
              <button
                key={preset.title}
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddPreset(preset)}
              >
                {preset.icon} {preset.title}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Goals List */}
      {activeGoals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-title">No goals yet</div>
          <div className="empty-state-text">Create daily goals to build habits and earn XP!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {activeGoals.map(goal => {
            const value = todayLogs.get(goal.id) ?? 0;
            const isComplete = goal.type === 'checkbox' ? value >= 1 : value >= goal.target;
            const progress = goal.type === 'checkbox' ? (value >= 1 ? 100 : 0) : Math.min(100, Math.round((value / goal.target) * 100));

            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
                style={{
                  padding: '1rem 1.25rem',
                  borderColor: isComplete ? 'rgba(52, 211, 153, 0.3)' : undefined,
                  background: isComplete ? 'rgba(52, 211, 153, 0.05)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{goal.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{goal.title}</span>
                      {isComplete && <Check size={16} style={{ color: 'var(--color-success)' }} />}
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      height: '4px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-border)',
                      marginTop: '0.375rem',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        style={{
                          height: '100%',
                          borderRadius: 'var(--radius-full)',
                          background: isComplete ? 'var(--color-success)' : 'var(--gradient-accent)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {goal.type === 'checkbox' ? (
                      <button
                        className="btn btn-icon"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--radius-full)',
                          border: `2px solid ${isComplete ? 'var(--color-success)' : 'var(--color-border)'}`,
                          background: isComplete ? 'var(--color-success)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleCheckbox(goal)}
                        aria-label={isComplete ? 'Uncheck goal' : 'Check goal'}
                      >
                        {isComplete && <Check size={16} color="white" />}
                      </button>
                    ) : (
                      <>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => handleDecrement(goal)} aria-label="Decrease">
                          <Minus size={14} />
                        </button>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          minWidth: '3rem',
                          textAlign: 'center',
                          color: isComplete ? 'var(--color-success)' : undefined,
                        }}>
                          {value}/{goal.target}
                        </span>
                        <button className="btn btn-secondary btn-icon btn-sm" onClick={() => handleIncrement(goal)} aria-label="Increase">
                          <Plus size={14} />
                        </button>
                      </>
                    )}
                    <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', minWidth: '2rem' }}>
                      {goal.unit}
                    </span>
                  </div>

                  {/* Edit/Delete */}
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingGoal(goal); setShowForm(true); }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { archiveGoal(goal.id); toast('Goal archived', 'info'); }} title="Archive">
                      <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <AnimatePresence>
        {showForm && (
          <GoalFormModal
            goal={editingGoal}
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              if (editingGoal) {
                await updateGoal(editingGoal.id, data);
                toast('Goal updated', 'success');
              } else {
                await addGoal(data as any);
                toast('Goal added!', 'success');
              }
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GoalFormModal({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal | null;
  onClose: () => void;
  onSave: (data: Partial<Goal>) => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? '');
  const [type, setType] = useState<GoalType>(goal?.type ?? 'counter');
  const [target, setTarget] = useState(goal?.target ?? 1);
  const [step, setStep] = useState(goal?.step ?? 1);
  const [unit, setUnit] = useState(goal?.unit ?? '');
  const [icon, setIcon] = useState(goal?.icon ?? '🎯');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    onSave({ title: title.trim(), type, target, step, unit, icon });
  };

  return (
    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>{goal ? 'Edit Goal' : 'New Goal'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>}
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="goal-title">Title *</label>
            <input id="goal-title" className="input" value={title} onChange={e => { setTitle(e.target.value); setError(''); }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="goal-type">Type</label>
              <select id="goal-type" className="input" value={type} onChange={e => setType(e.target.value as GoalType)}>
                <option value="checkbox">Checkbox</option>
                <option value="counter">Counter</option>
                <option value="time">Time-based</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="goal-icon">Icon</label>
              <input id="goal-icon" className="input" value={icon} onChange={e => setIcon(e.target.value)} maxLength={4} />
            </div>
          </div>
          {type !== 'checkbox' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="label" htmlFor="goal-target">Target</label>
                <input id="goal-target" className="input" type="number" min={1} value={target} onChange={e => setTarget(Number(e.target.value))} />
              </div>
              <div>
                <label className="label" htmlFor="goal-step">Step</label>
                <input id="goal-step" className="input" type="number" min={1} value={step} onChange={e => setStep(Number(e.target.value))} />
              </div>
              <div>
                <label className="label" htmlFor="goal-unit">Unit</label>
                <input id="goal-unit" className="input" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. glasses" />
              </div>
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{goal ? 'Update' : 'Add Goal'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
