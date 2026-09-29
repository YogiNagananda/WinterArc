import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Timer, Zap } from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';
import { formatMinutes } from '../utils/dates';

export function FocusPage() {
  const profile = useStore(s => s.profile);
  const tasks = useStore(s => s.tasks);
  const subjects = useStore(s => s.subjects);
  const focusTimer = useStore(s => s.focusTimer);
  const startFocusTimer = useStore(s => s.startFocusTimer);
  const pauseFocusTimer = useStore(s => s.pauseFocusTimer);
  const resumeFocusTimer = useStore(s => s.resumeFocusTimer);
  const stopFocusTimer = useStore(s => s.stopFocusTimer);
  const toast = useToast();

  const [targetMinutes, setTargetMinutes] = useState(25);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [elapsed, setElapsed] = useState(0);

  // Calculate elapsed time from timestamps (survives refresh)
  useEffect(() => {
    if (!focusTimer.isRunning) {
      setElapsed(0);
      return;
    }

    const calculateElapsed = () => {
      let totalMs = focusTimer.accumulatedMs;
      if (focusTimer.startedAt && !focusTimer.isPaused) {
        totalMs += Date.now() - new Date(focusTimer.startedAt).getTime();
      }
      setElapsed(Math.floor(totalMs / 1000));
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [focusTimer]);

  // Check if timer exceeded target
  useEffect(() => {
    if (focusTimer.isRunning && elapsed >= focusTimer.targetMinutes * 60) {
      // Timer completed
      if (profile.soundEnabled) {
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
          osc.stop(ctx.currentTime + 0.8);
        } catch {}
      }
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Focus Timer Complete! ⏰', {
          body: `You focused for ${formatMinutes(focusTimer.targetMinutes)}. Great work!`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [elapsed, focusTimer.isRunning, focusTimer.targetMinutes, profile.soundEnabled]);

  const totalSeconds = focusTimer.isRunning ? focusTimer.targetMinutes * 60 : targetMinutes * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const progress = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const handleStart = async () => {
    await startFocusTimer(
      targetMinutes,
      selectedTaskId || undefined,
      selectedSubjectId || undefined,
    );
    toast('Focus session started!', 'info');
  };

  const handlePause = async () => {
    await pauseFocusTimer();
  };

  const handleResume = async () => {
    await resumeFocusTimer();
  };

  const handleStop = async () => {
    const session = await stopFocusTimer();
    if (session) {
      toast(`Focus session: ${session.minutes} min logged. +XP ⚡`, 'success');
    }
  };

  const activeTasks = tasks.filter(t => !t.archived);
  const activeSubjects = subjects.filter(s => !s.archived);

  // Circle timer dimensions
  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="page-header" style={{ width: '100%' }}>
        <h1 className="page-title">Focus Timer</h1>
        <p className="page-subtitle">Deep work, zero distractions</p>
      </div>

      {/* Timer Circle */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ position: 'relative', marginBottom: '2rem' }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={remaining <= 0 && focusTimer.isRunning ? 'var(--color-success)' : 'var(--color-accent)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              filter: `drop-shadow(0 0 8px ${remaining <= 0 ? 'var(--color-success)' : 'var(--color-accent)'})`,
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.05em',
          }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          {focusTimer.isRunning && (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
              {focusTimer.isPaused ? 'Paused' : remaining <= 0 ? 'Overtime!' : 'Focusing...'}
            </span>
          )}
        </div>
      </motion.div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        {!focusTimer.isRunning ? (
          <button className="btn btn-primary btn-lg" onClick={handleStart} style={{ borderRadius: 'var(--radius-full)', minWidth: '140px' }}>
            <Play size={20} /> Start
          </button>
        ) : (
          <>
            {focusTimer.isPaused ? (
              <button className="btn btn-primary btn-lg" onClick={handleResume} style={{ borderRadius: 'var(--radius-full)' }}>
                <Play size={20} /> Resume
              </button>
            ) : (
              <button className="btn btn-secondary btn-lg" onClick={handlePause} style={{ borderRadius: 'var(--radius-full)' }}>
                <Pause size={20} /> Pause
              </button>
            )}
            <button className="btn btn-danger btn-lg" onClick={handleStop} style={{ borderRadius: 'var(--radius-full)' }}>
              <Square size={20} /> Stop
            </button>
          </>
        )}
      </div>

      {/* Settings (only when not running) */}
      {!focusTimer.isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{ padding: '1.25rem', width: '100%', maxWidth: '400px' }}
        >
          <div style={{ marginBottom: '0.75rem' }}>
            <label className="label" htmlFor="focus-duration">Duration</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[15, 25, 30, 45, 60, 90].map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${targetMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTargetMinutes(m)}
                >
                  {formatMinutes(m)}
                </button>
              ))}
            </div>
          </div>

          {activeTasks.length > 0 && (
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="label" htmlFor="focus-task">Link to Task</label>
              <select id="focus-task" className="input" value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
                <option value="">Free timer</option>
                {activeTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          {activeSubjects.length > 0 && (
            <div>
              <label className="label" htmlFor="focus-subject">Link to Subject</label>
              <select id="focus-subject" className="input" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)}>
                <option value="">None</option>
                {activeSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </motion.div>
      )}

      {/* XP Info */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', justifyContent: 'center' }}>
          <Zap size={12} style={{ color: 'var(--color-xp)' }} />
          Every 25 minutes of focus = +10 XP
        </div>
      </div>
    </div>
  );
}
