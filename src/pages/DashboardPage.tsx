import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Flame, Trophy, Zap, Star, Calendar, Clock, Snowflake, Heart, RefreshCw, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store';
import { ProgressRing } from '../components/ProgressRing';
import { getEffectiveToday, getArcDay, daysUntilStart, formatDate, formatTime, isTaskScheduledForDate } from '../utils/dates';
import { getLevel, getNextLevel, getLevelProgress, getDayCompletionPercent, type DayItems } from '../rules/rules';
import { getQuoteForDate, getRandomQuote, quotes } from '../data/quotes';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const profile = useStore(s => s.profile);
  const tasks = useStore(s => s.tasks);
  const taskCompletions = useStore(s => s.taskCompletions);
  const goals = useStore(s => s.goals);
  const goalLogs = useStore(s => s.goalLogs);
  const favoriteQuotes = useStore(s => s.favoriteQuotes);
  const toggleFavoriteQuote = useStore(s => s.toggleFavoriteQuote);

  const today = getEffectiveToday(profile.rolloverHour);
  const arcDay = getArcDay(profile.startDate, profile.arcLength, today);
  const daysToStart = daysUntilStart(profile.startDate, today);
  const arcComplete = arcDay > profile.arcLength;

  const level = getLevel(profile.totalXp);
  const nextLevel = getNextLevel(profile.totalXp);
  const levelProgress = getLevelProgress(profile.totalXp);

  // Today's quote
  const [quoteState, setQuoteState] = useState(() => {
    const q = getQuoteForDate(today);
    const idx = quotes.indexOf(q);
    return { quote: q, index: idx };
  });

  const isFavorite = favoriteQuotes.some(f => f.index === quoteState.index);

  // Today's tasks
  const todayTasks = useMemo(() =>
    tasks.filter(t => isTaskScheduledForDate(t, today)),
    [tasks, today]
  );

  const todayCompletionIds = useMemo(() =>
    new Set(
      taskCompletions
        .filter(c => c.date === today)
        .map(c => c.taskId)
    ),
    [taskCompletions, today]
  );

  const activeGoals = useMemo(() =>
    goals.filter(g => !g.archived),
    [goals]
  );

  const todayGoalLogs = useMemo(() => {
    const map = new Map<string, number>();
    goalLogs.filter(l => l.date === today).forEach(l => map.set(l.goalId, l.value));
    return map;
  }, [goalLogs, today]);

  const dayItems: DayItems = {
    scheduledTasks: todayTasks,
    completedTaskIds: todayCompletionIds,
    goals: activeGoals,
    goalLogs: todayGoalLogs,
  };

  const completionPercent = getDayCompletionPercent(dayItems);

  // Next upcoming task
  const nextTask = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return todayTasks
      .filter(t => {
        if (!t.startTime || todayCompletionIds.has(t.id)) return false;
        const [h, m] = t.startTime.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  }, [todayTasks, todayCompletionIds]);

  const handleNewQuote = () => {
    const { quote, index } = getRandomQuote(quoteState.index);
    setQuoteState({ quote, index });
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Night owl? 🦉';
    if (hour < 12) return 'Good morning ☀️';
    if (hour < 17) return 'Good afternoon 🌤';
    if (hour < 21) return 'Good evening 🌆';
    return 'Night grind 🌙';
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-header"
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{greeting}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </motion.div>

      {/* Arc Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card"
        style={{ padding: '1.25rem', marginBottom: '1rem' }}
      >
        {daysToStart > 0 ? (
          <div style={{ textAlign: 'center' }}>
            <Snowflake size={32} style={{ color: 'var(--color-accent)', margin: '0 auto 0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">
              Winter Arc starts in {daysToStart} day{daysToStart !== 1 ? 's' : ''}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Prepare yourself. The grind begins soon.
            </p>
          </div>
        ) : arcComplete ? (
          <div style={{ textAlign: 'center' }}>
            <Trophy size={40} style={{ color: 'var(--color-warning)', margin: '0 auto 0.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }} className="text-gradient">
              🎉 Arc Complete!
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              You finished {profile.arcLength} days. Total XP: {profile.totalXp}. Level: {level.name}.
            </p>
            <Link to="/stats" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              View Full Summary
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <ProgressRing progress={completionPercent} size={96}>
              <span style={{ fontSize: '1.375rem', fontWeight: 800 }}>{completionPercent}%</span>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>today</span>
            </ProgressRing>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar size={15} style={{ color: 'var(--color-accent)' }} />
                <span className="text-gradient" style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Day {arcDay} of {profile.arcLength}
                </span>
              </div>
              <div className="progress-bar-track" style={{ marginBottom: '0.875rem' }}>
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((arcDay / profile.arcLength) * 100, 100)}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span className="stat-chip" style={{ color: 'var(--color-streak)' }}>
                  <Flame size={13} />{profile.streak} streak
                </span>
                <span className="stat-chip" style={{ color: 'var(--color-warning)' }}>
                  <Trophy size={13} />{profile.bestStreak} best
                </span>
                <span className="stat-chip" style={{ color: 'var(--color-xp)' }}>
                  <Zap size={13} />{profile.totalXp} XP
                </span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card"
        style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Star size={16} style={{ color: 'var(--color-xp)', filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.5))' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{level.name}</span>
          </div>
          {nextLevel && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {nextLevel.minXp - profile.totalXp} XP to {nextLevel.name}
            </span>
          )}
        </div>
        <div className="progress-bar-track" style={{ height: '7px' }}>
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{ background: 'linear-gradient(90deg, var(--color-xp), var(--color-accent))' }}
          />
        </div>
      </motion.div>

      {/* Quote */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card"
        style={{ padding: '1.25rem', marginBottom: '1rem' }}
      >
        <p style={{ fontStyle: 'italic', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          "{quoteState.quote.text}"
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            — {quoteState.quote.author}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-ghost btn-sm btn-icon"
              onClick={() => toggleFavoriteQuote(quoteState.index)}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={14} fill={isFavorite ? 'var(--color-danger)' : 'none'} color={isFavorite ? 'var(--color-danger)' : undefined} />
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={handleNewQuote} aria-label="New quote">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Today's Tasks Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card"
        style={{ padding: '1.25rem', marginBottom: '1rem' }}
      >
        <div className="section-heading">
          <h3 className="section-title">Today's Tasks</h3>
          <Link to="/tasks" className="section-link">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {todayTasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <div className="empty-state-icon" style={{ fontSize: '2rem' }}>📋</div>
            <div className="empty-state-title" style={{ fontSize: '0.9375rem' }}>No tasks today</div>
            <div className="empty-state-text">Add tasks from the Tasks page to get started!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {todayTasks.slice(0, 5).map(task => {
              const done = todayCompletionIds.has(task.id);
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: done ? 'var(--color-success-subtle)' : 'var(--color-bg-hover)',
                    border: '1px solid',
                    borderColor: done ? 'rgba(0,217,127,0.2)' : 'transparent',
                    transition: 'all 0.2s ease',
                    opacity: done ? 0.65 : 1,
                  }}
                >
                  <div className={`priority-dot priority-dot-${task.priority}`} />
                  <span style={{
                    flex: 1,
                    fontSize: '0.8125rem',
                    fontWeight: done ? 400 : 500,
                    textDecoration: done ? 'line-through' : 'none',
                    color: done ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.title}
                  </span>
                  {task.startTime && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                      {formatTime(task.startTime)}
                    </span>
                  )}
                  {done && <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>✓</span>}
                </div>
              );
            })}
            {todayTasks.length > 5 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '0.25rem 0' }}>
                +{todayTasks.length - 5} more
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Next Task Countdown */}
      {nextTask && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card"
          style={{ padding: '1rem 1.25rem', marginBottom: '1rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={16} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Next up:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{nextTask.title}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
              at {formatTime(nextTask.startTime)}
            </span>
          </div>
        </motion.div>
      )}

      {/* Goals Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card"
        style={{ padding: '1.25rem' }}
      >
        <div className="section-heading">
          <h3 className="section-title">Daily Goals</h3>
          <Link to="/goals" className="section-link">
            View all <ChevronRight size={13} />
          </Link>
        </div>
        {activeGoals.length === 0 ? (
          <div className="empty-state" style={{ padding: '1.5rem 0' }}>
            <div className="empty-state-icon" style={{ fontSize: '2rem' }}>🎯</div>
            <div className="empty-state-title" style={{ fontSize: '0.9375rem' }}>No goals yet</div>
            <div className="empty-state-text">Create daily goals to build lasting habits!</div>
          </div>
        ) : (
          <div className="card-grid">
            {activeGoals.slice(0, 6).map(goal => {
              const value = todayGoalLogs.get(goal.id) ?? 0;
              const done = goal.type === 'checkbox' ? value >= 1 : value >= goal.target;
              return (
                <div
                  key={goal.id}
                  style={{
                    padding: '0.875rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    background: done ? 'var(--color-success-subtle)' : 'var(--color-bg-hover)',
                    textAlign: 'center',
                    border: '1px solid',
                    borderColor: done ? 'rgba(0,217,127,0.25)' : 'var(--color-border)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '1.5rem', lineHeight: 1, marginBottom: '0.375rem' }}>{goal.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {goal.title}
                  </div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: done ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                    {goal.type === 'checkbox'
                      ? (done ? '✓ Done' : 'Pending')
                      : `${value}/${goal.target} ${goal.unit}`
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}


