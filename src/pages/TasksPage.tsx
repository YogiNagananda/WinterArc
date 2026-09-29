import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit2, Trash2, Copy, Check, X, ChevronDown, ChevronRight,
  Clock, AlertTriangle, ArrowRight, Filter,
} from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import {
  getEffectiveToday, isTaskScheduledForDate, formatTime,
  formatDate, addDays, parseLocalDate, formatMinutes, doTimesOverlap,
} from '../utils/dates';
import type { Task, Priority, RepeatType, TaskCategory, ReminderType } from '../types';
import { format, isAfter, isBefore } from 'date-fns';

const CATEGORIES: TaskCategory[] = ['Gym', 'Study', 'Health', 'Work', 'Personal'];

type ViewType = 'today' | 'upcoming' | 'completed' | 'all';

export function TasksPage() {
  const profile = useStore(s => s.profile);
  const tasks = useStore(s => s.tasks);
  const taskCompletions = useStore(s => s.taskCompletions);
  const addTask = useStore(s => s.addTask);
  const updateTask = useStore(s => s.updateTask);
  const archiveTask = useStore(s => s.archiveTask);
  const duplicateTask = useStore(s => s.duplicateTask);
  const completeTask = useStore(s => s.completeTask);
  const uncompleteTask = useStore(s => s.uncompleteTask);
  const toast = useToast();

  const today = getEffectiveToday(profile.rolloverHour);
  const [view, setView] = useState<ViewType>('today');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Completion lookup
  const completedToday = useMemo(
    () => new Set(taskCompletions.filter(c => c.date === today).map(c => c.taskId)),
    [taskCompletions, today]
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let list = tasks.filter(t => !t.archived);

    if (categoryFilter !== 'all') {
      list = list.filter(t => t.category === categoryFilter);
    }

    switch (view) {
      case 'today':
        return list.filter(t => isTaskScheduledForDate(t, today));
      case 'upcoming':
        return list.filter(t => {
          if (t.repeat.type !== 'none') return true;
          return isAfter(parseLocalDate(t.startDate), parseLocalDate(today));
        });
      case 'completed':
        return list.filter(t => completedToday.has(t.id) && isTaskScheduledForDate(t, today));
      case 'all':
      default:
        return list;
    }
  }, [tasks, view, today, categoryFilter, completedToday]);

  // Sort by time then priority
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      const pOrder = { high: 0, medium: 1, low: 2 };
      return pOrder[a.priority] - pOrder[b.priority];
    });
  }, [filteredTasks]);

  // Overlap warnings
  const overlaps = useMemo(() => {
    const todayTasks = tasks.filter(t => !t.archived && isTaskScheduledForDate(t, today) && t.startTime);
    const warnings = new Set<string>();
    for (let i = 0; i < todayTasks.length; i++) {
      for (let j = i + 1; j < todayTasks.length; j++) {
        if (doTimesOverlap(
          todayTasks[i].startTime, todayTasks[i].durationMin,
          todayTasks[j].startTime, todayTasks[j].durationMin
        )) {
          warnings.add(todayTasks[i].id);
          warnings.add(todayTasks[j].id);
        }
      }
    }
    return warnings;
  }, [tasks, today]);

  const handleToggleComplete = useCallback(async (taskId: string) => {
    if (completedToday.has(taskId)) {
      await uncompleteTask(taskId, today);
      toast('Task uncompleted', 'info');
    } else {
      await completeTask(taskId, today);
      toast('Task completed! +XP ⚡', 'success');
    }
  }, [completedToday, today, completeTask, uncompleteTask, toast]);

  const handleMoveToTomorrow = useCallback(async (taskId: string) => {
    const tomorrow = formatDate(addDays(parseLocalDate(today), 1));
    await updateTask(taskId, { startDate: tomorrow });
    toast('Moved to tomorrow', 'info');
  }, [today, updateTask, toast]);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Tasks</h1>
            <p className="page-subtitle">{format(parseLocalDate(today), 'EEEE, MMMM d')}</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowForm(true); }}>
            <Plus size={16} /> Add Task
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {(['today', 'upcoming', 'completed', 'all'] as ViewType[]).map(v => (
          <button
            key={v}
            className={`btn btn-sm ${view === v ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView(v)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
        <select
          className="input"
          style={{ width: 'auto', padding: '0.375rem 2rem 0.375rem 0.5rem', fontSize: '0.75rem' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Task List */}
      {sortedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tasks here</div>
          <div className="empty-state-text">
            {view === 'today' ? 'Nothing scheduled for today. Add a task to get started!' : 'No tasks found.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <AnimatePresence>
            {sortedTasks.map(task => {
              const isCompleted = completedToday.has(task.id);
              const isOverdue = view === 'today' && task.startTime && !isCompleted && (() => {
                const [h, m] = task.startTime.split(':').map(Number);
                const taskEnd = h * 60 + m + task.durationMin;
                const now = new Date();
                return now.getHours() * 60 + now.getMinutes() > taskEnd;
              })();
              const hasOverlap = overlaps.has(task.id);

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass-card"
                  style={{
                    padding: '0.875rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    opacity: isCompleted ? 0.65 : 1,
                    borderColor: isOverdue ? 'var(--color-danger)' : hasOverlap ? 'var(--color-warning)' : undefined,
                  }}
                >
                  {/* Complete checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task.id)}
                    className="btn-icon"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-full)',
                      border: `2px solid ${isCompleted ? 'var(--color-success)' : 'var(--color-border)'}`,
                      background: isCompleted ? 'var(--color-success)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                    aria-label={isCompleted ? 'Uncomplete task' : 'Complete task'}
                  >
                    {isCompleted && <Check size={14} color="white" />}
                  </button>

                  {/* Priority dot */}
                  <div className={`priority-dot priority-dot-${task.priority}`} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      textDecoration: isCompleted ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.125rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-accent">{task.category}</span>
                      {task.startTime && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={10} /> {formatTime(task.startTime)} · {formatMinutes(task.durationMin)}
                        </span>
                      )}
                      {task.repeat.type !== 'none' && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-accent)' }}>🔁 {task.repeat.type}</span>
                      )}
                      {hasOverlap && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
                          <AlertTriangle size={10} /> Overlap
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    {isOverdue && !isCompleted && (
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleMoveToTomorrow(task.id)} title="Move to tomorrow">
                        <ArrowRight size={14} />
                      </button>
                    )}
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditingTask(task); setShowForm(true); }} title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => duplicateTask(task.id).then(() => toast('Duplicated', 'info'))} title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { archiveTask(task.id); toast('Task archived', 'info'); }} title="Delete">
                      <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Task Form Modal */}
      <AnimatePresence>
        {showForm && (
          <TaskFormModal
            task={editingTask}
            onClose={() => setShowForm(false)}
            onSave={async (data) => {
              if (editingTask) {
                await updateTask(editingTask.id, data);
                toast('Task updated', 'success');
              } else {
                await addTask(data as any);
                toast('Task added!', 'success');
              }
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Task Form Modal ─────────────────────────────────────────────────────────

function TaskFormModal({
  task,
  onClose,
  onSave,
}: {
  task: Task | null;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
}) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [category, setCategory] = useState<string>(task?.category ?? 'Personal');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(task?.startDate ?? formatDate(new Date()));
  const [startTime, setStartTime] = useState(task?.startTime ?? '');
  const [durationMin, setDurationMin] = useState(task?.durationMin ?? 30);
  const [repeatType, setRepeatType] = useState<RepeatType>(task?.repeat?.type ?? 'none');
  const [repeatDays, setRepeatDays] = useState<number[]>(task?.repeat?.days ?? []);
  const [reminder, setReminder] = useState<ReminderType>(task?.reminder ?? 'none');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      startDate,
      startTime,
      durationMin,
      repeat: { type: repeatType, days: repeatDays },
      reminder,
    });
  };

  const toggleDay = (day: number) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 className="modal-title" style={{ marginBottom: 0 }}>
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>{error}</div>
          )}

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="task-title">Title *</label>
            <input id="task-title" className="input" value={title} onChange={e => { setTitle(e.target.value); setError(''); }} placeholder="What needs to be done?" />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="task-desc">Description</label>
            <textarea id="task-desc" className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." rows={2} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="task-category">Category</label>
              <select id="task-category" className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-priority">Priority</label>
              <select id="task-priority" className="input" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                <option value="low">Low (10 XP)</option>
                <option value="medium">Medium (20 XP)</option>
                <option value="high">High (30 XP)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label className="label" htmlFor="task-date">Date</label>
              <input id="task-date" className="input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="task-time">Time</label>
              <input id="task-time" className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="task-duration">Duration</label>
              <select id="task-duration" className="input" value={durationMin} onChange={e => setDurationMin(Number(e.target.value))}>
                {[15, 25, 30, 45, 60, 90, 120, 180].map(m => (
                  <option key={m} value={m}>{formatMinutes(m)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="task-repeat">Repeat</label>
            <select id="task-repeat" className="input" value={repeatType} onChange={e => setRepeatType(e.target.value as RepeatType)}>
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Weekdays (Mon-Fri)</option>
              <option value="weekly">Weekly (choose days)</option>
            </select>
          </div>

          {repeatType === 'weekly' && (
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <button
                  key={day}
                  type="button"
                  className={`btn btn-sm ${repeatDays.includes(i) ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleDay(i)}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="task-reminder">Reminder</label>
            <select id="task-reminder" className="input" value={reminder} onChange={e => setReminder(e.target.value as ReminderType)}>
              <option value="none">None</option>
              <option value="at_time">At start time</option>
              <option value="10_min_before">10 min before</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{task ? 'Update' : 'Add Task'}</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
