import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { useStore } from '../store';
import { getEffectiveToday, getArcDay, getDateRange, formatDate, parseLocalDate } from '../utils/dates';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { format, subDays, getDay } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function StatsPage() {
  const profile = useStore(s => s.profile);
  const taskCompletions = useStore(s => s.taskCompletions);
  const goalLogs = useStore(s => s.goalLogs);
  const focusSessions = useStore(s => s.focusSessions);
  const dayRecords = useStore(s => s.dayRecords);

  const today = getEffectiveToday(profile.rolloverHour);
  const arcDay = getArcDay(profile.startDate, profile.arcLength, today);

  // Last 30 days data
  const last30 = useMemo(() => {
    const dates: string[] = [];
    for (let i = 29; i >= 0; i--) {
      dates.push(formatDate(subDays(new Date(), i)));
    }
    return dates.map(date => {
      const completions = taskCompletions.filter(c => c.date === date).length;
      const focusMin = focusSessions
        .filter(f => f.startedAt.startsWith(date))
        .reduce((s, f) => s + f.minutes, 0);
      const record = dayRecords.find(r => r.date === date);
      return {
        date: format(parseLocalDate(date), 'MMM d'),
        dateRaw: date,
        tasks: completions,
        focusHrs: +(focusMin / 60).toFixed(1),
        xp: record?.xpEarned ?? 0,
      };
    });
  }, [taskCompletions, focusSessions, dayRecords]);

  // Heatmap data
  const heatmapData = useMemo(() => {
    if (!profile.startDate) return [];
    const start = profile.startDate;
    const endDate = formatDate(
      new Date(parseLocalDate(start).getTime() + (profile.arcLength - 1) * 86400000)
    );
    const dates = getDateRange(start, endDate);

    return dates.map(date => {
      const completions = taskCompletions.filter(c => c.date === date).length;
      const record = dayRecords.find(r => r.date === date);
      return {
        date,
        count: completions,
        successful: record?.successful ?? false,
      };
    });
  }, [profile.startDate, profile.arcLength, taskCompletions, dayRecords]);

  // Best weekday
  const bestWeekday = useMemo(() => {
    const counts = new Array(7).fill(0);
    taskCompletions.forEach(c => {
      const dow = getDay(parseLocalDate(c.date));
      counts[dow]++;
    });
    const maxIdx = counts.indexOf(Math.max(...counts));
    return DAYS[maxIdx];
  }, [taskCompletions]);

  // Category breakdown
  const tasks = useStore(s => s.tasks);
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    taskCompletions.forEach(c => {
      const task = tasks.find(t => t.id === c.taskId);
      if (task) {
        map.set(task.category, (map.get(task.category) ?? 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [taskCompletions, tasks]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Stats & Analytics</h1>
        <p className="page-subtitle">Your Winter Arc performance</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Tasks Completed" value={taskCompletions.length} icon="✅" />
        <StatCard label="Focus Hours" value={+(focusSessions.reduce((s, f) => s + f.minutes, 0) / 60).toFixed(1)} icon="⏱" />
        <StatCard label="Best Day" value={bestWeekday} icon="📅" />
        <StatCard label="Total XP" value={profile.totalXp} icon="⚡" />
      </div>

      {/* Tasks Completed Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Tasks Completed (30 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={last30}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.75rem' }} />
            <Bar dataKey="tasks" fill="var(--color-accent)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Focus Hours Chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Focus Hours (30 days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={last30}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.75rem' }} />
            <Area type="monotone" dataKey="focusHrs" stroke="var(--color-xp)" fill="rgba(167, 139, 250, 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
          90-Day Heatmap
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, 14px)',
          gap: '3px',
          justifyContent: 'center',
        }}>
          {heatmapData.map(d => {
            const isPast = d.date <= today;
            const intensity = Math.min(4, d.count);
            const colors = [
              'var(--color-border)',
              'rgba(56, 189, 248, 0.2)',
              'rgba(56, 189, 248, 0.4)',
              'rgba(56, 189, 248, 0.6)',
              'rgba(56, 189, 248, 0.9)',
            ];
            return (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} tasks`}
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '2px',
                  background: isPast ? colors[intensity] : 'var(--color-frost)',
                  border: d.date === today ? '1px solid var(--color-accent)' : 'none',
                }}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Category Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {categoryBreakdown.map(cat => {
              const maxCount = categoryBreakdown[0].count;
              const width = Math.max(10, (cat.count / maxCount) * 100);
              return (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, width: '70px', flexShrink: 0 }}>{cat.name}</span>
                  <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--color-border)' }}>
                    <div style={{ width: `${width}%`, height: '100%', borderRadius: '4px', background: 'var(--gradient-accent)' }} />
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', width: '30px', textAlign: 'right' }}>{cat.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{icon}</div>
      <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}
