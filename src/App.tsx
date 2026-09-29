import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { FocusPage } from './pages/FocusPage';
import { GoalsPage } from './pages/GoalsPage';
import { GymPage } from './pages/GymPage';
import { StudyPage } from './pages/StudyPage';
import { RewardsPage } from './pages/RewardsPage';
import { NotesPage } from './pages/NotesPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useStore } from './store';
import { createSampleData } from './data/sampleData';
import * as db from './db';

function App() {
  const initialized = useStore(s => s.initialized);
  const loading = useStore(s => s.loading);
  const initialize = useStore(s => s.initialize);
  const profile = useStore(s => s.profile);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load sample data on first launch
  useEffect(() => {
    if (!initialized) return;
    if (profile.sampleDataLoaded) return;

    const loadSample = async () => {
      const { sampleTasks, sampleGoals, sampleNotes } = createSampleData();
      for (const task of sampleTasks) await db.putItem('tasks', task);
      for (const goal of sampleGoals) await db.putItem('goals', goal);
      for (const note of sampleNotes) await db.putItem('notes', note);

      const updatedProfile = { ...profile, sampleDataLoaded: true };
      await db.saveProfile(updatedProfile);

      // Re-initialize to pick up sample data
      await initialize();
    };

    loadSample();
  }, [initialized, profile.sampleDataLoaded]);

  // Apply theme on load
  useEffect(() => {
    if (initialized) {
      document.documentElement.setAttribute('data-theme', profile.theme);
    }
  }, [initialized, profile.theme]);

  if (loading && !initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg-primary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❄️</div>
          <div className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 800 }}>WINTER ARC</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="focus" element={<FocusPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="gym" element={<GymPage />} />
          <Route path="study" element={<StudyPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
