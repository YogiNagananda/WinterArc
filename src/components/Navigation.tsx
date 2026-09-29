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
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/focus', icon: Timer, label: 'Focus' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/gym', icon: Dumbbell, label: 'Gym' },
  { to: '/study', icon: BookOpen, label: 'Study' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

// Show fewer items on bottom nav for mobile
const mobileNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/focus', icon: Timer, label: 'Focus' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
];

export function Sidebar() {
  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Snowflake size={24} style={{ color: 'var(--color-accent)' }} />
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              background: 'var(--gradient-accent)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            WINTER ARC
          </h1>
        </div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          90-Day Discipline Tracker
        </p>
      </div>
      <nav>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.to === '/'}
          >
            <item.icon size={18} />
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
          <item.icon size={20} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
