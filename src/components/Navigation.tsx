import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Timer,
  Target,
  Dumbbell,
  BookOpen,
  Gift,
  StickyNote,
  BarChart3,
  Settings,
  Snowflake,
  Flame,
} from 'lucide-react';
import { useStore } from '../store';
import { getEffectiveToday, getArcDay } from '../utils/dates';
import { getLevel } from '../rules/rules';

const navItems = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks',   icon: CheckSquare,     label: 'Tasks'     },
  { to: '/focus',   icon: Timer,           label: 'Focus'     },
  { to: '/goals',   icon: Target,          label: 'Goals'     },
  { to: '/gym',     icon: Dumbbell,        label: 'Gym'       },
  { to: '/study',   icon: BookOpen,        label: 'Study'     },
  { to: '/rewards', icon: Gift,            label: 'Rewards'   },
  { to: '/notes',   icon: StickyNote,      label: 'Notes'     },
  { to: '/stats',   icon: BarChart3,       label: 'Stats'     },
  { to: '/settings',icon: Settings,        label: 'Settings'  },
];

const mobileNavItems = [
  { to: '/',      icon: LayoutDashboard, label: 'Home'  },
  { to: '/tasks', icon: CheckSquare,     label: 'Tasks' },
  { to: '/focus', icon: Timer,           label: 'Focus' },
  { to: '/goals', icon: Target,          label: 'Goals' },
  { to: '/notes', icon: StickyNote,      label: 'Notes' },
];

export function Sidebar() {
  const profile  = useStore(s => s.profile);
  const today    = getEffectiveToday(profile.rolloverHour);
  const arcDay   = getArcDay(profile.startDate, profile.arcLength, today);
  const level    = getLevel(profile.totalXp);
  const arcPct   = Math.min((arcDay / profile.arcLength) * 100, 100);

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div style={{ padding: '0 1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
          <Snowflake
            size={22}
            strokeWidth={2}
            style={{ color: 'var(--color-accent)', filter: 'drop-shadow(0 0 6px rgba(0,217,255,0.5))' }}
          />
          <span
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              letterSpacing: '-0.01em',
              background: 'var(--gradient-hero)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WINTER ARC
          </span>
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.03em' }}>
          90-Day Discipline Tracker
        </p>
      </div>

      {/* Arc progress card */}
      <div
        style={{
          margin: '0 0.75rem 1.5rem',
          padding: '0.875rem 1rem',
          background: 'var(--color-accent-subtle)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)' }}>
            Day {arcDay > 0 ? arcDay : '—'} of {profile.arcLength}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-streak)', fontWeight: 700 }}>
            <Flame size={12} />
            {profile.streak}
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${arcPct}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {level.name}
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            {profile.totalXp} XP
          </span>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <item.icon size={18} strokeWidth={1.75} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      {mobileNavItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end={item.to === '/'}
        >
          <item.icon size={20} strokeWidth={1.75} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
