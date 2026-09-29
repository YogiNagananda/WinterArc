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

import { colors } from './src/theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Splash / Loading Component
// ─────────────────────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <View style={loadStyles.container}>
      <Text style={loadStyles.emoji}>❄️</Text>
      <Text style={loadStyles.brand}>WINTER ARC</Text>
      <Text style={loadStyles.tagline}>90 Days. No Excuses. One Direction.</Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
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
    color: colors.iceBlue,
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
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

  useEffect(() => {
    initialize();
  }, []);

  if (!initialized) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
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
    backgroundColor: colors.bgPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  screenContainer: {
    flex: 1,
  },
});
