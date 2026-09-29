import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Volume2, VolumeX, Bell, BellOff, Download, Upload,
  Trash2, RotateCcw, Info, Snowflake,
} from 'lucide-react';
import { useStore } from '../store';
import { useToast } from '../components/Toast';

export function SettingsPage() {
  const profile = useStore(s => s.profile);
  const updateProfile = useStore(s => s.updateProfile);
  const exportData = useStore(s => s.exportData);
  const importData = useStore(s => s.importData);
  const clearAllData = useStore(s => s.clearAllData);
  const clearSampleData = useStore(s => s.clearSampleData);
  const toast = useToast();

  const [confirmReset, setConfirmReset] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `winter-arc-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast('Data exported!', 'success');
    } catch {
      toast('Export failed', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      JSON.parse(text); // validate
      if (!confirm('Import this file? This will overwrite all current data.')) return;
      await importData(text);
      toast('Data imported successfully!', 'success');
    } catch {
      toast('Invalid file', 'error');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    if (confirmReset !== 'RESET') return;
    await clearAllData();
    setShowResetConfirm(false);
    setConfirmReset('');
    toast('All data cleared', 'info');
  };

  const toggleTheme = () => {
    const newTheme = profile.theme === 'dark' ? 'light' : 'dark';
    updateProfile({ theme: newTheme });
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your Winter Arc experience</p>
      </div>

      {/* Arc Configuration */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Snowflake size={16} style={{ color: 'var(--color-accent)' }} /> Arc Configuration
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label className="label" htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              className="input"
              type="date"
              value={profile.startDate}
              onChange={e => updateProfile({ startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label" htmlFor="arc-length">Arc Length (days)</label>
            <input
              id="arc-length"
              className="input"
              type="number"
              min={1}
              max={365}
              value={profile.arcLength}
              onChange={e => updateProfile({ arcLength: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label" htmlFor="rollover-hour">Day Rollover Hour</label>
            <select
              id="rollover-hour"
              className="input"
              value={profile.rolloverHour}
              onChange={e => updateProfile({ rolloverHour: Number(e.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{i}:00 AM</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Appearance & Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Preferences</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SettingToggle
            icon={profile.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
            label="Theme"
            value={profile.theme === 'dark' ? 'Dark' : 'Light'}
            onClick={toggleTheme}
          />
          <SettingToggle
            icon={profile.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            label="Sounds"
            value={profile.soundEnabled ? 'On' : 'Off'}
            onClick={() => updateProfile({ soundEnabled: !profile.soundEnabled })}
          />
          <SettingToggle
            icon={profile.notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            label="Notifications"
            value={profile.notificationsEnabled ? 'On' : 'Off'}
            onClick={async () => {
              if (!profile.notificationsEnabled && 'Notification' in window) {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') {
                  toast('Notification permission denied', 'warning');
                  return;
                }
              }
              updateProfile({ notificationsEnabled: !profile.notificationsEnabled });
            }}
          />
        </div>
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(96, 165, 250, 0.1)',
          border: '1px solid rgba(96, 165, 250, 0.2)',
          fontSize: '0.75rem',
          color: 'var(--color-info)',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start',
        }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Browsers cannot guarantee reminders while the app is fully closed. For the most reliable notifications, keep the app open or install it as a PWA.
          </span>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>Data Management</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export Data
          </button>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          {profile.sampleDataLoaded && (
            <button className="btn btn-secondary" onClick={async () => { await clearSampleData(); toast('Sample data cleared', 'info'); }}>
              <RotateCcw size={14} /> Clear Sample Data
            </button>
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card" style={{ padding: '1.25rem', borderColor: 'rgba(248, 113, 113, 0.3)' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--color-danger)' }}>Danger Zone</h3>
        {!showResetConfirm ? (
          <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
            <Trash2 size={14} /> Reset All Data
          </button>
        ) : (
          <div>
            <p style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>
              Type <strong>RESET</strong> to confirm deleting all data:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="input"
                value={confirmReset}
                onChange={e => setConfirmReset(e.target.value)}
                placeholder="Type RESET"
                style={{ flex: 1 }}
              />
              <button className="btn btn-danger" onClick={handleReset} disabled={confirmReset !== 'RESET'}>
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={() => { setShowResetConfirm(false); setConfirmReset(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SettingToggle({ icon, label, value, onClick }: { icon: React.ReactNode; label: string; value: string; onClick: () => void }) {
  return (
    <button
      className="btn btn-ghost"
      style={{ width: '100%', justifyContent: 'space-between', padding: '0.5rem 0.75rem' }}
      onClick={onClick}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        <span style={{ fontSize: '0.875rem' }}>{label}</span>
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{value}</span>
    </button>
  );
}
