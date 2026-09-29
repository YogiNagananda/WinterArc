import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useWinterStore } from './src/store/useWinterStore';
import { Header } from './src/components/Header';
import { BottomTabs } from './src/components/BottomTabs';

// Screens
import { DashboardScreen } from './src/screens/DashboardScreen';
import { TasksScreen } from './src/screens/TasksScreen';
import { FocusScreen } from './src/screens/FocusScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { GymScreen } from './src/screens/GymScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { useTheme } from './src/theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Splash / Loading Component
// ─────────────────────────────────────────────────────────────────────────────
function LoadingScreen() {
  const { colors } = useTheme();

  return (
    <View style={[loadStyles.container, { backgroundColor: colors.bgPrimary }]}>
      <Text style={loadStyles.emoji}>❄️</Text>
      <Text style={[loadStyles.brand, { color: colors.iceBlue }]}>WINTER ARC</Text>
      <Text style={[loadStyles.tagline, { color: colors.textMuted }]}>
        90 Days. No Excuses. One Direction.
      </Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen Router — maps activeTab → screen component
// ─────────────────────────────────────────────────────────────────────────────
function ActiveScreen() {
  const activeTab = useWinterStore(s => s.activeTab);

  switch (activeTab) {
    case 'dashboard':
      return <DashboardScreen />;
    case 'tasks':
      return <TasksScreen />;
    case 'focus':
      return <FocusScreen />;
    case 'goals':
      return <GoalsScreen />;
    case 'gym':
      return <GymScreen />;
    case 'study':
      return <StudyScreen />;
    case 'rewards':
      return <RewardsScreen />;
    case 'notes':
      return <NotesScreen />;
    case 'stats':
      return <StatsScreen />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const initialized = useWinterStore(s => s.initialized);
  const initialize = useWinterStore(s => s.initialize);
  const focusTimer = useWinterStore(s => s.focusTimer);
  const stopFocusTimer = useWinterStore(s => s.stopFocusTimer);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    initialize();
  }, []);

  // Global background timer tracker so sessions finish even if navigating away
  useEffect(() => {
    if (focusTimer.isRunning && !focusTimer.isPaused && focusTimer.startedAt) {
      const checkInterval = setInterval(() => {
        const elapsed = Math.floor(
          (focusTimer.accumulatedMs + (Date.now() - focusTimer.startedAt!)) / 1000
        );
        if (elapsed >= focusTimer.targetMinutes * 60) {
          stopFocusTimer();
        }
      }, 2000);
      return () => clearInterval(checkInterval);
    }
  }, [
    focusTimer.isRunning,
    focusTimer.isPaused,
    focusTimer.startedAt,
    focusTimer.accumulatedMs,
    focusTimer.targetMinutes,
    stopFocusTimer,
  ]);

  if (!initialized) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.bgPrimary}
        />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgPrimary}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgPrimary }]}>
        <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
          {/* Sticky header with arc day, streak, XP */}
          <Header />

          {/* Main content area — switches based on activeTab */}
          <View style={styles.screenContainer}>
            <ActiveScreen />
          </View>

          {/* Bottom navigation */}
          <BottomTabs />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
});
