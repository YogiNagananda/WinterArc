import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Task,
  TaskCompletion,
  Goal,
  GoalLog,
  Note,
  JournalEntry,
  GymSession,
  BodyWeightLog,
  StudySubject,
  StudySession,
  Reward,
  Redemption,
  Profile,
  DayRecord,
  FocusTimerState,
  FocusSession,
} from '../types';

// In-memory fallback cache in case native module or web storage is temporarily unavailable
const memoryCache: Record<string, string> = {};

/**
 * Universal safe storage adapter:
 * - Falls back to window.localStorage on Web/Expo Web to prevent null native module error
 * - Uses AsyncStorage on Native (Android / iOS)
 * - Uses in-memory cache as safe fallback
 */
export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {}
    try {
      const val = await AsyncStorage.getItem(key);
      if (val !== null) return val;
    } catch {}
    return memoryCache[key] ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    memoryCache[key] = value;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },

  removeItem: async (key: string): Promise<void> => {
    delete memoryCache[key];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

const STORAGE_KEYS = {
  TASKS: '@winterarc_tasks',
  COMPLETIONS: '@winterarc_completions',
  GOALS: '@winterarc_goals',
  GOAL_LOGS: '@winterarc_goal_logs',
  NOTES: '@winterarc_notes',
  JOURNAL: '@winterarc_journal',
  GYM_SESSIONS: '@winterarc_gym_sessions',
  WEIGHT_LOGS: '@winterarc_weight_logs',
  STUDY_SUBJECTS: '@winterarc_study_subjects',
  STUDY_SESSIONS: '@winterarc_study_sessions',
  REWARDS: '@winterarc_rewards',
  REDEMPTIONS: '@winterarc_redemptions',
  PROFILE: '@winterarc_profile',
  DAY_RECORDS: '@winterarc_day_records',
  FOCUS_TIMER: '@winterarc_focus_timer',
  FOCUS_SESSIONS: '@winterarc_focus_sessions',
};

async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await safeStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await safeStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
}

export const defaultProfile: Profile = {
  startDate: new Date().toISOString().split('T')[0],
  arcLength: 90,
  rolloverHour: 4,
  totalXp: 120,
  spendableXp: 80,
  streak: 5,
  bestStreak: 7,
  freezesLeft: 2,
  freezeResetWeek: '',
  theme: 'dark',
  soundEnabled: true,
  notificationsEnabled: true,
  sampleDataLoaded: false,
};

export const defaultFocusTimer: FocusTimerState = {
  isRunning: false,
  isPaused: false,
  targetMinutes: 25,
  startedAt: null,
  accumulatedMs: 0,
  taskId: undefined,
  completedSessions: [],
};

export const localDb = {
  getTasks: () => getItem<Task[]>(STORAGE_KEYS.TASKS, []),
  saveTasks: (tasks: Task[]) => setItem(STORAGE_KEYS.TASKS, tasks),

  getCompletions: () => getItem<TaskCompletion[]>(STORAGE_KEYS.COMPLETIONS, []),
  saveCompletions: (completions: TaskCompletion[]) => setItem(STORAGE_KEYS.COMPLETIONS, completions),

  getGoals: () => getItem<Goal[]>(STORAGE_KEYS.GOALS, []),
  saveGoals: (goals: Goal[]) => setItem(STORAGE_KEYS.GOALS, goals),

  getGoalLogs: () => getItem<GoalLog[]>(STORAGE_KEYS.GOAL_LOGS, []),
  saveGoalLogs: (logs: GoalLog[]) => setItem(STORAGE_KEYS.GOAL_LOGS, logs),

  getNotes: () => getItem<Note[]>(STORAGE_KEYS.NOTES, []),
  saveNotes: (notes: Note[]) => setItem(STORAGE_KEYS.NOTES, notes),

  getJournal: () => getItem<JournalEntry[]>(STORAGE_KEYS.JOURNAL, []),
  saveJournal: (entries: JournalEntry[]) => setItem(STORAGE_KEYS.JOURNAL, entries),

  getGymSessions: () => getItem<GymSession[]>(STORAGE_KEYS.GYM_SESSIONS, []),
  saveGymSessions: (sessions: GymSession[]) => setItem(STORAGE_KEYS.GYM_SESSIONS, sessions),

  getWeightLogs: () => getItem<BodyWeightLog[]>(STORAGE_KEYS.WEIGHT_LOGS, []),
  saveWeightLogs: (logs: BodyWeightLog[]) => setItem(STORAGE_KEYS.WEIGHT_LOGS, logs),

  getStudySubjects: () => getItem<StudySubject[]>(STORAGE_KEYS.STUDY_SUBJECTS, []),
  saveStudySubjects: (subjects: StudySubject[]) => setItem(STORAGE_KEYS.STUDY_SUBJECTS, subjects),

  getStudySessions: () => getItem<StudySession[]>(STORAGE_KEYS.STUDY_SESSIONS, []),
  saveStudySessions: (sessions: StudySession[]) => setItem(STORAGE_KEYS.STUDY_SESSIONS, sessions),

  getRewards: () => getItem<Reward[]>(STORAGE_KEYS.REWARDS, []),
  saveRewards: (rewards: Reward[]) => setItem(STORAGE_KEYS.REWARDS, rewards),

  getRedemptions: () => getItem<Redemption[]>(STORAGE_KEYS.REDEMPTIONS, []),
  saveRedemptions: (redemptions: Redemption[]) => setItem(STORAGE_KEYS.REDEMPTIONS, redemptions),

  getProfile: () => getItem<Profile>(STORAGE_KEYS.PROFILE, defaultProfile),
  saveProfile: (profile: Profile) => setItem(STORAGE_KEYS.PROFILE, profile),

  getDayRecords: () => getItem<DayRecord[]>(STORAGE_KEYS.DAY_RECORDS, []),
  saveDayRecords: (records: DayRecord[]) => setItem(STORAGE_KEYS.DAY_RECORDS, records),

  getFocusTimer: () => getItem<FocusTimerState>(STORAGE_KEYS.FOCUS_TIMER, defaultFocusTimer),
  saveFocusTimer: (timer: FocusTimerState) => setItem(STORAGE_KEYS.FOCUS_TIMER, timer),

  getFocusSessions: () => getItem<FocusSession[]>(STORAGE_KEYS.FOCUS_SESSIONS, []),
  saveFocusSessions: (sessions: FocusSession[]) => setItem(STORAGE_KEYS.FOCUS_SESSIONS, sessions),
};
