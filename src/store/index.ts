// ─── WINTER ARC – Main Zustand Store ─────────────────────────────────────────
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type {
  Task, TaskCompletion, Goal, GoalLog, FocusSession, FocusTimerState,
  Note, JournalEntry, GymSession, BodyWeightLog, Subject, StudySession,
  Reward, Redemption, DayRecord, Profile, WeeklyReview, EarnedBadge,
  FavoriteQuote, ChecklistItem, GymSplit, NotesPinConfig,
} from '../types';
import * as db from '../db';
import { CURRENT_SCHEMA_VERSION, migrateIfNeeded } from '../db';
import { getEffectiveToday, getISOWeekString, formatDate } from '../utils/dates';
import { getTaskXp, canUseFreeze } from '../rules/rules';

// ─── Store shape ─────────────────────────────────────────────────────────────

interface WinterArcState {
  // Loading
  initialized: boolean;
  loading: boolean;

  // Profile
  profile: Profile;

  // Data
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  goals: Goal[];
  goalLogs: GoalLog[];
  focusSessions: FocusSession[];
  focusTimer: FocusTimerState;
  notes: Note[];
  journalEntries: JournalEntry[];
  gymSessions: GymSession[];
  bodyWeightLogs: BodyWeightLog[];
  subjects: Subject[];
  studySessions: StudySession[];
  rewards: Reward[];
  redemptions: Redemption[];
  dayRecords: DayRecord[];
  weeklyReviews: WeeklyReview[];
  earnedBadges: EarnedBadge[];
  favoriteQuotes: FavoriteQuote[];
  gymSplit: GymSplit | null;
  notesPinConfig: NotesPinConfig | null;

  // ─── Actions ─────────────────────────────────────────────────────────────

  // Init
  initialize: () => Promise<void>;

  // Profile
  updateProfile: (updates: Partial<Profile>) => Promise<void>;

  // Tasks
  addTask: (task: Omit<Task, 'id' | 'xp' | 'archived' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;
  completeTask: (taskId: string, date: string, actualMinutes?: number) => Promise<void>;
  uncompleteTask: (taskId: string, date: string) => Promise<void>;

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'archived' | 'createdAt'>) => Promise<Goal>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  archiveGoal: (id: string) => Promise<void>;
  updateGoalLog: (goalId: string, date: string, value: number) => Promise<void>;

  // Focus
  startFocusTimer: (targetMinutes: number, taskId?: string, subjectId?: string) => Promise<void>;
  pauseFocusTimer: () => Promise<void>;
  resumeFocusTimer: () => Promise<void>;
  stopFocusTimer: () => Promise<FocusSession | null>;

  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  saveJournalEntry: (entry: JournalEntry) => Promise<void>;

  // Gym
  addGymSession: (session: Omit<GymSession, 'id'>) => Promise<GymSession>;
  updateGymSession: (id: string, updates: Partial<GymSession>) => Promise<void>;
  deleteGymSession: (id: string) => Promise<void>;
  addBodyWeightLog: (log: BodyWeightLog) => Promise<void>;
  saveGymSplit: (split: GymSplit) => Promise<void>;

  // Study
  addSubject: (subject: Omit<Subject, 'id' | 'archived'>) => Promise<Subject>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  archiveSubject: (id: string) => Promise<void>;
  addStudySession: (session: Omit<StudySession, 'id'>) => Promise<StudySession>;
  deleteStudySession: (id: string) => Promise<void>;

  // Rewards
  addReward: (reward: Omit<Reward, 'id' | 'archived'>) => Promise<Reward>;
  updateReward: (id: string, updates: Partial<Reward>) => Promise<void>;
  archiveReward: (id: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<boolean>;

  // Day records
  saveDayRecord: (record: DayRecord) => Promise<void>;
  useStreakFreeze: (date: string) => Promise<boolean>;

  // Weekly review
  saveWeeklyReview: (review: WeeklyReview) => Promise<void>;

  // Badges
  earnBadge: (badgeId: string) => Promise<void>;

  // Quotes
  toggleFavoriteQuote: (index: number) => Promise<void>;

  // Notes PIN
  setNotesPin: (config: NotesPinConfig) => Promise<void>;

  // Data management
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  clearSampleData: () => Promise<void>;
}

// ─── Default profile ─────────────────────────────────────────────────────────

function defaultProfile(): Profile {
  return {
    startDate: '2026-10-01',
    arcLength: 90,
    rolloverHour: 4,
    totalXp: 0,
    spendableXp: 0,
    streak: 0,
    bestStreak: 0,
    freezesLeft: 1,
    freezeResetWeek: '',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: false,
    lastBackupReminder: new Date().toISOString(),
    sampleDataLoaded: false,
  };
}

const defaultFocusTimer: FocusTimerState = {
  isRunning: false,
  isPaused: false,
  accumulatedMs: 0,
  targetMinutes: 25,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useStore = create<WinterArcState>((set, get) => ({
  initialized: false,
  loading: true,

  profile: defaultProfile(),
  tasks: [],
  taskCompletions: [],
  goals: [],
  goalLogs: [],
  focusSessions: [],
  focusTimer: defaultFocusTimer,
  notes: [],
  journalEntries: [],
  gymSessions: [],
  bodyWeightLogs: [],
  subjects: [],
  studySessions: [],
  rewards: [],
  redemptions: [],
  dayRecords: [],
  weeklyReviews: [],
  earnedBadges: [],
  favoriteQuotes: [],
  gymSplit: null,
  notesPinConfig: null,

  // ─── Initialize ──────────────────────────────────────────────────────────

  initialize: async () => {
    try {
      // Request persistent storage
      if (navigator.storage?.persist) {
        await navigator.storage.persist();
      }

      let profile = await db.getProfile();
      if (!profile) {
        profile = defaultProfile();
        await db.saveProfile(profile);
      } else {
        profile = await migrateIfNeeded(profile);
        await db.saveProfile(profile);
      }

      // Check freeze reset
      const today = getEffectiveToday(profile.rolloverHour);
      const currentWeek = getISOWeekString(today);
      const freezeCheck = canUseFreeze(profile.freezesLeft, profile.freezeResetWeek, currentWeek);
      if (profile.freezeResetWeek !== currentWeek) {
        profile.freezesLeft = freezeCheck.freezesLeft;
        profile.freezeResetWeek = currentWeek;
        await db.saveProfile(profile);
      }

      const focusTimerState = await db.getFocusTimerState();

      const [
        tasks, taskCompletions, goals, goalLogs, focusSessions,
        notes, journalEntries, gymSessions, bodyWeightLogs,
        subjects, studySessions, rewards, redemptions,
        dayRecords, weeklyReviews, earnedBadges, favoriteQuotes,
      ] = await Promise.all([
        db.getAll<Task>('tasks'),
        db.getAll<TaskCompletion>('taskCompletions'),
        db.getAll<Goal>('goals'),
        db.getAll<GoalLog>('goalLogs'),
        db.getAll<FocusSession>('focusSessions'),
        db.getAll<Note>('notes'),
        db.getAll<JournalEntry>('journalEntries'),
        db.getAll<GymSession>('gymSessions'),
        db.getAll<BodyWeightLog>('bodyWeightLogs'),
        db.getAll<Subject>('subjects'),
        db.getAll<StudySession>('studySessions'),
        db.getAll<Reward>('rewards'),
        db.getAll<Redemption>('redemptions'),
        db.getAll<DayRecord>('dayRecords'),
        db.getAll<WeeklyReview>('weeklyReviews'),
        db.getAll<EarnedBadge>('earnedBadges'),
        db.getAll<FavoriteQuote>('favoriteQuotes'),
      ]);

      const gymSplit = await db.getGymSplit() ?? null;
      const notesPinConfig = await db.getNotesPinConfig() ?? null;

      set({
        initialized: true,
        loading: false,
        profile,
        tasks,
        taskCompletions,
        goals,
        goalLogs,
        focusSessions,
        focusTimer: focusTimerState ?? defaultFocusTimer,
        notes,
        journalEntries,
        gymSessions,
        bodyWeightLogs,
        subjects,
        studySessions,
        rewards,
        redemptions,
        dayRecords,
        weeklyReviews,
        earnedBadges,
        favoriteQuotes,
        gymSplit,
        notesPinConfig,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ loading: false });
    }
  },

  // ─── Profile ─────────────────────────────────────────────────────────────

  updateProfile: async (updates) => {
    const profile = { ...get().profile, ...updates };
    await db.saveProfile(profile);
    set({ profile });
  },

  // ─── Tasks ───────────────────────────────────────────────────────────────

  addTask: async (taskData) => {
    const task: Task = {
      ...taskData,
      id: nanoid(),
      xp: getTaskXp(taskData.priority),
      archived: false,
      createdAt: new Date().toISOString(),
    };
    await db.putItem('tasks', task);
    set(s => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: async (id, updates) => {
    const tasks = get().tasks.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      if (updates.priority) updated.xp = getTaskXp(updates.priority);
      return updated;
    });
    const task = tasks.find(t => t.id === id);
    if (task) await db.putItem('tasks', task);
    set({ tasks });
  },

  archiveTask: async (id) => {
    await get().updateTask(id, { archived: true });
  },

  duplicateTask: async (id) => {
    const original = get().tasks.find(t => t.id === id);
    if (!original) throw new Error('Task not found');
    const { id: _, createdAt: __, ...rest } = original;
    return get().addTask(rest);
  },

  completeTask: async (taskId, date, actualMinutes) => {
    const completion: TaskCompletion = {
      taskId,
      date,
      completedAt: new Date().toISOString(),
      actualMinutes: actualMinutes ?? 0,
    };
    await db.putItem('taskCompletions', completion);

    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      const xp = getTaskXp(task.priority);
      const profile = {
        ...get().profile,
        totalXp: get().profile.totalXp + xp,
        spendableXp: get().profile.spendableXp + xp,
      };
      await db.saveProfile(profile);
      set(s => ({
        taskCompletions: [...s.taskCompletions, completion],
        profile,
      }));
    } else {
      set(s => ({
        taskCompletions: [...s.taskCompletions, completion],
      }));
    }
  },

  uncompleteTask: async (taskId, date) => {
    await db.deleteItem('taskCompletions', [taskId, date]);
    const task = get().tasks.find(t => t.id === taskId);
    if (task) {
      const xp = getTaskXp(task.priority);
      const profile = {
        ...get().profile,
        totalXp: Math.max(0, get().profile.totalXp - xp),
        spendableXp: Math.max(0, get().profile.spendableXp - xp),
      };
      await db.saveProfile(profile);
      set(s => ({
        taskCompletions: s.taskCompletions.filter(
          c => !(c.taskId === taskId && c.date === date)
        ),
        profile,
      }));
    } else {
      set(s => ({
        taskCompletions: s.taskCompletions.filter(
          c => !(c.taskId === taskId && c.date === date)
        ),
      }));
    }
  },

  // ─── Goals ───────────────────────────────────────────────────────────────

  addGoal: async (goalData) => {
    const goal: Goal = {
      ...goalData,
      id: nanoid(),
      archived: false,
      createdAt: new Date().toISOString(),
    };
    await db.putItem('goals', goal);
    set(s => ({ goals: [...s.goals, goal] }));
    return goal;
  },

  updateGoal: async (id, updates) => {
    const goals = get().goals.map(g =>
      g.id === id ? { ...g, ...updates } : g
    );
    const goal = goals.find(g => g.id === id);
    if (goal) await db.putItem('goals', goal);
    set({ goals });
  },

  archiveGoal: async (id) => {
    await get().updateGoal(id, { archived: true });
  },

  updateGoalLog: async (goalId, date, value) => {
    const log: GoalLog = { goalId, date, value };
    await db.putItem('goalLogs', log);

    set(s => {
      const existing = s.goalLogs.findIndex(
        l => l.goalId === goalId && l.date === date
      );
      if (existing >= 0) {
        const logs = [...s.goalLogs];
        logs[existing] = log;
        return { goalLogs: logs };
      }
      return { goalLogs: [...s.goalLogs, log] };
    });

    // Check if goal just completed and award XP
    const goal = get().goals.find(g => g.id === goalId);
    if (goal) {
      const completed = goal.type === 'checkbox' ? value >= 1 : value >= goal.target;
      const prevLogs = get().goalLogs.filter(l => l.goalId === goalId && l.date === date);
      const prevValue = prevLogs.length > 0 ? prevLogs[prevLogs.length - 1].value : 0;
      const prevCompleted = goal.type === 'checkbox' ? prevValue >= 1 : prevValue >= goal.target;

      if (completed && !prevCompleted) {
        const profile = {
          ...get().profile,
          totalXp: get().profile.totalXp + 15,
          spendableXp: get().profile.spendableXp + 15,
        };
        await db.saveProfile(profile);
        set({ profile });
      }
    }
  },

  // ─── Focus Timer ─────────────────────────────────────────────────────────

  startFocusTimer: async (targetMinutes, taskId, subjectId) => {
    const timer: FocusTimerState = {
      isRunning: true,
      isPaused: false,
      taskId,
      subjectId,
      startedAt: new Date().toISOString(),
      accumulatedMs: 0,
      targetMinutes,
    };
    await db.saveFocusTimerState(timer);
    set({ focusTimer: timer });
  },

  pauseFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning || timer.isPaused) return;

    const now = Date.now();
    const startedAt = new Date(timer.startedAt!).getTime();
    const elapsed = now - startedAt;

    const updated: FocusTimerState = {
      ...timer,
      isPaused: true,
      accumulatedMs: timer.accumulatedMs + elapsed,
      startedAt: undefined,
    };
    await db.saveFocusTimerState(updated);
    set({ focusTimer: updated });
  },

  resumeFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning || !timer.isPaused) return;

    const updated: FocusTimerState = {
      ...timer,
      isPaused: false,
      startedAt: new Date().toISOString(),
    };
    await db.saveFocusTimerState(updated);
    set({ focusTimer: updated });
  },

  stopFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning) return null;

    let totalMs = timer.accumulatedMs;
    if (timer.startedAt && !timer.isPaused) {
      totalMs += Date.now() - new Date(timer.startedAt).getTime();
    }

    const minutes = Math.round(totalMs / 60000);
    if (minutes <= 0) {
      await db.clearFocusTimerState();
      set({ focusTimer: defaultFocusTimer });
      return null;
    }

    const today = getEffectiveToday(get().profile.rolloverHour);
    const session: FocusSession = {
      id: nanoid(),
      taskId: timer.taskId,
      subjectId: timer.subjectId,
      startedAt: new Date().toISOString(),
      minutes,
    };

    await db.putItem('focusSessions', session);
    await db.clearFocusTimerState();

    // Award focus XP
    const focusXp = Math.floor(minutes / 25) * 10;
    if (focusXp > 0) {
      const profile = {
        ...get().profile,
        totalXp: get().profile.totalXp + focusXp,
        spendableXp: get().profile.spendableXp + focusXp,
      };
      await db.saveProfile(profile);
      set(s => ({
        focusSessions: [...s.focusSessions, session],
        focusTimer: defaultFocusTimer,
        profile,
      }));
    } else {
      set(s => ({
        focusSessions: [...s.focusSessions, session],
        focusTimer: defaultFocusTimer,
      }));
    }

    return session;
  },

  // ─── Notes ───────────────────────────────────────────────────────────────

  addNote: async (noteData) => {
    const note: Note = {
      ...noteData,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.putItem('notes', note);
    set(s => ({ notes: [...s.notes, note] }));
    return note;
  },

  updateNote: async (id, updates) => {
    const notes = get().notes.map(n =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    const note = notes.find(n => n.id === id);
    if (note) await db.putItem('notes', note);
    set({ notes });
  },

  deleteNote: async (id) => {
    await db.deleteItem('notes', id);
    set(s => ({ notes: s.notes.filter(n => n.id !== id) }));
  },

  saveJournalEntry: async (entry) => {
    await db.putItem('journalEntries', entry);
    set(s => {
      const existing = s.journalEntries.findIndex(e => e.date === entry.date);
      if (existing >= 0) {
        const entries = [...s.journalEntries];
        entries[existing] = entry;
        return { journalEntries: entries };
      }
      return { journalEntries: [...s.journalEntries, entry] };
    });
  },

  // ─── Gym ─────────────────────────────────────────────────────────────────

  addGymSession: async (sessionData) => {
    const session: GymSession = { ...sessionData, id: nanoid() };
    await db.putItem('gymSessions', session);
    set(s => ({ gymSessions: [...s.gymSessions, session] }));
    return session;
  },

  updateGymSession: async (id, updates) => {
    const sessions = get().gymSessions.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    const session = sessions.find(s => s.id === id);
    if (session) await db.putItem('gymSessions', session);
    set({ gymSessions: sessions });
  },

  deleteGymSession: async (id) => {
    await db.deleteItem('gymSessions', id);
    set(s => ({ gymSessions: s.gymSessions.filter(gs => gs.id !== id) }));
  },

  addBodyWeightLog: async (log) => {
    await db.putItem('bodyWeightLogs', log);
    set(s => {
      const existing = s.bodyWeightLogs.findIndex(l => l.date === log.date);
      if (existing >= 0) {
        const logs = [...s.bodyWeightLogs];
        logs[existing] = log;
        return { bodyWeightLogs: logs };
      }
      return { bodyWeightLogs: [...s.bodyWeightLogs, log] };
    });
  },

  saveGymSplit: async (split) => {
    await db.saveGymSplit(split);
    set({ gymSplit: split });
  },

  // ─── Study ───────────────────────────────────────────────────────────────

  addSubject: async (subjectData) => {
    const subject: Subject = { ...subjectData, id: nanoid(), archived: false };
    await db.putItem('subjects', subject);
    set(s => ({ subjects: [...s.subjects, subject] }));
    return subject;
  },

  updateSubject: async (id, updates) => {
    const subjects = get().subjects.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );
    const subject = subjects.find(s => s.id === id);
    if (subject) await db.putItem('subjects', subject);
    set({ subjects });
  },

  archiveSubject: async (id) => {
    await get().updateSubject(id, { archived: true });
  },

  addStudySession: async (sessionData) => {
    const session: StudySession = { ...sessionData, id: nanoid() };
    await db.putItem('studySessions', session);
    set(s => ({ studySessions: [...s.studySessions, session] }));
    return session;
  },

  deleteStudySession: async (id) => {
    await db.deleteItem('studySessions', id);
    set(s => ({ studySessions: s.studySessions.filter(ss => ss.id !== id) }));
  },

  // ─── Rewards ─────────────────────────────────────────────────────────────

  addReward: async (rewardData) => {
    const reward: Reward = { ...rewardData, id: nanoid(), archived: false };
    await db.putItem('rewards', reward);
    set(s => ({ rewards: [...s.rewards, reward] }));
    return reward;
  },

  updateReward: async (id, updates) => {
    const rewards = get().rewards.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    const reward = rewards.find(r => r.id === id);
    if (reward) await db.putItem('rewards', reward);
    set({ rewards });
  },

  archiveReward: async (id) => {
    await get().updateReward(id, { archived: true });
  },

  redeemReward: async (rewardId) => {
    const reward = get().rewards.find(r => r.id === rewardId);
    if (!reward || reward.archived) return false;
    if (get().profile.spendableXp < reward.cost) return false;

    const redemption: Redemption = {
      id: nanoid(),
      rewardId,
      redeemedAt: new Date().toISOString(),
    };
    await db.putItem('redemptions', redemption);

    const profile = {
      ...get().profile,
      spendableXp: get().profile.spendableXp - reward.cost,
      // totalXp stays the same!
    };
    await db.saveProfile(profile);

    set(s => ({
      redemptions: [...s.redemptions, redemption],
      profile,
    }));
    return true;
  },

  // ─── Day Records ─────────────────────────────────────────────────────────

  saveDayRecord: async (record) => {
    await db.putItem('dayRecords', record);
    set(s => {
      const existing = s.dayRecords.findIndex(r => r.date === record.date);
      if (existing >= 0) {
        const records = [...s.dayRecords];
        records[existing] = record;
        return { dayRecords: records };
      }
      return { dayRecords: [...s.dayRecords, record] };
    });
  },

  useStreakFreeze: async (date) => {
    const { profile } = get();
    const today = getEffectiveToday(profile.rolloverHour);
    const currentWeek = getISOWeekString(today);
    const { available, freezesLeft } = canUseFreeze(
      profile.freezesLeft, profile.freezeResetWeek, currentWeek
    );

    if (!available) return false;

    const updatedProfile = {
      ...profile,
      freezesLeft: freezesLeft - 1,
      freezeResetWeek: currentWeek,
    };
    await db.saveProfile(updatedProfile);

    const record: DayRecord = {
      date,
      successful: false,
      xpEarned: 0,
      freezeUsed: true,
    };
    await db.putItem('dayRecords', record);

    set(s => ({
      profile: updatedProfile,
      dayRecords: [
        ...s.dayRecords.filter(r => r.date !== date),
        record,
      ],
    }));
    return true;
  },

  // ─── Weekly Review ───────────────────────────────────────────────────────

  saveWeeklyReview: async (review) => {
    await db.putItem('weeklyReviews', review);
    set(s => {
      const existing = s.weeklyReviews.findIndex(r => r.weekId === review.weekId);
      if (existing >= 0) {
        const reviews = [...s.weeklyReviews];
        reviews[existing] = review;
        return { weeklyReviews: reviews };
      }
      return { weeklyReviews: [...s.weeklyReviews, review] };
    });
  },

  // ─── Badges ──────────────────────────────────────────────────────────────

  earnBadge: async (badgeId) => {
    const already = get().earnedBadges.find(b => b.badgeId === badgeId);
    if (already) return;

    const earned: EarnedBadge = {
      badgeId,
      earnedAt: new Date().toISOString(),
    };
    await db.putItem('earnedBadges', earned);
    set(s => ({ earnedBadges: [...s.earnedBadges, earned] }));
  },

  // ─── Quotes ──────────────────────────────────────────────────────────────

  toggleFavoriteQuote: async (index) => {
    const existing = get().favoriteQuotes.find(f => f.index === index);
    if (existing) {
      await db.deleteItem('favoriteQuotes', index);
      set(s => ({
        favoriteQuotes: s.favoriteQuotes.filter(f => f.index !== index),
      }));
    } else {
      const fav: FavoriteQuote = { index, favoritedAt: new Date().toISOString() };
      await db.putItem('favoriteQuotes', fav);
      set(s => ({
        favoriteQuotes: [...s.favoriteQuotes, fav],
      }));
    }
  },

  // ─── Notes PIN ───────────────────────────────────────────────────────────

  setNotesPin: async (config) => {
    await db.saveNotesPinConfig(config);
    set({ notesPinConfig: config });
  },

  // ─── Data Management ─────────────────────────────────────────────────────

  exportData: async () => {
    const data = await db.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  importData: async (json) => {
    const data = JSON.parse(json);
    await db.importAllData(data);
    // Re-initialize
    await get().initialize();
  },

  clearAllData: async () => {
    await db.clearAllData();
    set({
      profile: defaultProfile(),
      tasks: [],
      taskCompletions: [],
      goals: [],
      goalLogs: [],
      focusSessions: [],
      focusTimer: defaultFocusTimer,
      notes: [],
      journalEntries: [],
      gymSessions: [],
      bodyWeightLogs: [],
      subjects: [],
      studySessions: [],
      rewards: [],
      redemptions: [],
      dayRecords: [],
      weeklyReviews: [],
      earnedBadges: [],
      favoriteQuotes: [],
      gymSplit: null,
      notesPinConfig: null,
    });
    await db.saveProfile(defaultProfile());
  },

  clearSampleData: async () => {
    // Clear only tasks/goals/notes that have 'sample' tag
    const state = get();

    // Remove sample tasks
    const sampleTasks = state.tasks.filter(t => t.description?.includes('[sample]'));
    for (const t of sampleTasks) {
      await db.deleteItem('tasks', t.id);
      // Also clean completions
      const completions = state.taskCompletions.filter(c => c.taskId === t.id);
      for (const c of completions) {
        await db.deleteItem('taskCompletions', [c.taskId, c.date]);
      }
    }

    // Remove sample goals
    const sampleGoals = state.goals.filter(g => g.title?.includes('[sample]') || g.icon === '🧪');
    for (const g of sampleGoals) {
      await db.deleteItem('goals', g.id);
    }

    // Remove sample notes
    const sampleNotes = state.notes.filter(n => n.tags?.includes('sample'));
    for (const n of sampleNotes) {
      await db.deleteItem('notes', n.id);
    }

    const profile = { ...state.profile, sampleDataLoaded: false };
    await db.saveProfile(profile);

    // Re-initialize
    await get().initialize();
  },
}));
