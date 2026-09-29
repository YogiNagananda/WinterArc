import { create } from 'zustand';
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
import { localDb, defaultProfile, defaultFocusTimer } from '../lib/storage';
import { getSampleData } from '../lib/sampleData';
import { syncWithSupabase, deleteFromSupabase, pullFromSupabase } from '../lib/syncEngine';

export type ScreenTab =
  | 'dashboard'
  | 'tasks'
  | 'focus'
  | 'goals'
  | 'gym'
  | 'study'
  | 'rewards'
  | 'notes'
  | 'stats'
  | 'settings';

interface WinterState {
  initialized: boolean;
  activeTab: ScreenTab;
  profile: Profile;
  tasks: Task[];
  completions: TaskCompletion[];
  goals: Goal[];
  goalLogs: GoalLog[];
  notes: Note[];
  journalEntries: JournalEntry[];
  gymSessions: GymSession[];
  weightLogs: BodyWeightLog[];
  studySubjects: StudySubject[];
  studySessions: StudySession[];
  rewards: Reward[];
  redemptions: Redemption[];
  dayRecords: DayRecord[];
  focusTimer: FocusTimerState;
  isSyncing: boolean;
  syncMessage: string;

  // Actions
  initialize: () => Promise<void>;
  setActiveTab: (tab: ScreenTab) => void;
  toggleTaskCompletion: (taskId: string, date: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'archived'> & { archived?: boolean }) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateGoalProgress: (goalId: string, date: string, delta: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'archived'> & { archived?: boolean }) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  saveNote: (note: Partial<Note> & { title: string; body: string }) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  
  // Focus Timer actions
  startFocusTimer: (targetMinutes?: number, taskId?: string) => Promise<void>;
  pauseFocusTimer: () => Promise<void>;
  resumeFocusTimer: () => Promise<void>;
  stopFocusTimer: () => Promise<FocusSession | null>;
  resetFocusTimer: () => Promise<void>;
  setFocusTargetMinutes: (minutes: number) => Promise<void>;
  setFocusSelectedTaskId: (taskId?: string) => void;
  logFocusSession: (minutes: number, taskId?: string, subjectId?: string) => Promise<void>;

  addGymSession: (exercises: GymSession['exercises']) => Promise<void>;
  logWeight: (kg: number) => Promise<void>;
  addStudySession: (subjectId: string, minutes: number) => Promise<void>;
  addSubject: (name: string, weeklyTargetMin: number) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<boolean>;
  addReward: (title: string, cost: number) => Promise<void>;
  saveJournalEntry: (text: string, mood: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  triggerSync: () => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  resetToSampleData: () => Promise<void>;
}

export const useWinterStore = create<WinterState>((set, get) => ({
  initialized: false,
  activeTab: 'dashboard',
  profile: defaultProfile,
  tasks: [],
  completions: [],
  goals: [],
  goalLogs: [],
  notes: [],
  journalEntries: [],
  gymSessions: [],
  weightLogs: [],
  studySubjects: [],
  studySessions: [],
  rewards: [],
  redemptions: [],
  dayRecords: [],
  focusTimer: defaultFocusTimer,
  isSyncing: false,
  syncMessage: '',

  initialize: async () => {
    const profile = await localDb.getProfile();
    let tasks = await localDb.getTasks();
    let goals = await localDb.getGoals();
    let notes = await localDb.getNotes();
    let gymSessions = await localDb.getGymSessions();
    let weightLogs = await localDb.getWeightLogs();
    let studySubjects = await localDb.getStudySubjects();
    let rewards = await localDb.getRewards();
    const focusTimer = await localDb.getFocusTimer();

    // Check if cloud has data or if initial sample data needed
    if (!profile.sampleDataLoaded && tasks.length === 0) {
      // First attempt to pull from Supabase cloud
      const pullResult = await pullFromSupabase();
      tasks = await localDb.getTasks();
      goals = await localDb.getGoals();
      notes = await localDb.getNotes();

      // If still empty, seed sample data
      if (tasks.length === 0) {
        const sample = getSampleData();
        tasks = sample.tasks;
        goals = sample.goals;
        notes = sample.notes;
        gymSessions = sample.gymSessions;
        weightLogs = sample.weightLogs;
        studySubjects = sample.studySubjects;
        rewards = sample.rewards;

        await localDb.saveTasks(tasks);
        await localDb.saveGoals(goals);
        await localDb.saveNotes(notes);
        await localDb.saveGymSessions(gymSessions);
        await localDb.saveWeightLogs(weightLogs);
        await localDb.saveStudySubjects(studySubjects);
        await localDb.saveRewards(rewards);

        profile.sampleDataLoaded = true;
        await localDb.saveProfile(profile);
      }
    }

    const completions = await localDb.getCompletions();
    const goalLogs = await localDb.getGoalLogs();
    const journalEntries = await localDb.getJournal();
    const studySessions = await localDb.getStudySessions();
    const redemptions = await localDb.getRedemptions();
    const dayRecords = await localDb.getDayRecords();

    set({
      initialized: true,
      profile,
      tasks,
      completions,
      goals,
      goalLogs,
      notes,
      journalEntries,
      gymSessions,
      weightLogs,
      studySubjects,
      studySessions,
      rewards,
      redemptions,
      dayRecords,
      focusTimer,
    });

    // Background sync with Supabase
    get().triggerSync();
  },

  setActiveTab: (tab: ScreenTab) => set({ activeTab: tab }),

  toggleTaskCompletion: async (taskId: string, date: string) => {
    const { completions, tasks, profile } = get();
    const existingIndex = completions.findIndex(c => c.taskId === taskId && c.date === date);
    let nextCompletions: TaskCompletion[];
    let xpDelta = 0;
    const task = tasks.find(t => t.id === taskId);
    const xpValue = task?.xp || 20;

    if (existingIndex >= 0) {
      // Uncheck
      nextCompletions = completions.filter((_, i) => i !== existingIndex);
      xpDelta = -xpValue;
      deleteFromSupabase('task_completions', 'task_id', taskId).catch(() => {});
    } else {
      // Complete
      nextCompletions = [
        ...completions,
        {
          id: `comp-${Date.now()}`,
          taskId,
          date,
          completedAt: new Date().toISOString(),
          actualMinutes: task?.durationMin || 30,
        },
      ];
      xpDelta = xpValue;
    }

    const nextTotalXp = Math.max(0, profile.totalXp + xpDelta);
    const nextSpendableXp = Math.max(0, profile.spendableXp + xpDelta);
    const updatedProfile = { ...profile, totalXp: nextTotalXp, spendableXp: nextSpendableXp };

    await localDb.saveCompletions(nextCompletions);
    await localDb.saveProfile(updatedProfile);

    set({ completions: nextCompletions, profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  addTask: async (taskInput) => {
    const newTask: Task = {
      ...taskInput,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const nextTasks = [newTask, ...get().tasks];
    await localDb.saveTasks(nextTasks);
    set({ tasks: nextTasks });
    syncWithSupabase().catch(() => {});
  },

  deleteTask: async (taskId: string) => {
    const nextTasks = get().tasks.filter(t => t.id !== taskId);
    await localDb.saveTasks(nextTasks);
    set({ tasks: nextTasks });
    deleteFromSupabase('tasks', 'id', taskId).catch(() => {});
  },

  updateGoalProgress: async (goalId: string, date: string, delta: number) => {
    const { goalLogs, goals, profile } = get();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const existingLog = goalLogs.find(l => l.goalId === goalId && l.date === date);
    const currentVal = existingLog ? existingLog.value : 0;
    const nextVal = Math.max(0, currentVal + delta);

    let nextLogs: GoalLog[];
    if (existingLog) {
      nextLogs = goalLogs.map(l => (l.goalId === goalId && l.date === date ? { ...l, value: nextVal } : l));
    } else {
      nextLogs = [...goalLogs, { goalId, date, value: nextVal }];
    }

    // Award XP if goal achieved today
    let updatedProfile = profile;
    if (nextVal >= goal.target && currentVal < goal.target) {
      updatedProfile = {
        ...profile,
        totalXp: profile.totalXp + 25,
        spendableXp: profile.spendableXp + 25,
      };
      await localDb.saveProfile(updatedProfile);
    }

    await localDb.saveGoalLogs(nextLogs);
    set({ goalLogs: nextLogs, profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  addGoal: async (goalInput) => {
    const newGoal: Goal = {
      ...goalInput,
      id: `goal-${Date.now()}`,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const nextGoals = [...get().goals, newGoal];
    await localDb.saveGoals(nextGoals);
    set({ goals: nextGoals });
    syncWithSupabase().catch(() => {});
  },

  deleteGoal: async (goalId: string) => {
    const nextGoals = get().goals.filter(g => g.id !== goalId);
    await localDb.saveGoals(nextGoals);
    set({ goals: nextGoals });
    deleteFromSupabase('goals', 'id', goalId).catch(() => {});
  },

  saveNote: async (noteInput) => {
    const { notes } = get();
    const id = noteInput.id || `note-${Date.now()}`;
    const existingIndex = notes.findIndex(n => n.id === id);

    let nextNotes: Note[];
    if (existingIndex >= 0) {
      nextNotes = notes.map(n =>
        n.id === id
          ? {
              ...n,
              ...noteInput,
              updatedAt: new Date().toISOString(),
            }
          : n
      );
    } else {
      const newNote: Note = {
        id,
        title: noteInput.title,
        body: noteInput.body,
        checklist: noteInput.checklist || [],
        tags: noteInput.tags || [],
        color: noteInput.color || '#1a2644',
        pinned: !!noteInput.pinned,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      nextNotes = [newNote, ...notes];
    }

    await localDb.saveNotes(nextNotes);
    set({ notes: nextNotes });
    syncWithSupabase().catch(() => {});
  },

  deleteNote: async (noteId: string) => {
    const nextNotes = get().notes.filter(n => n.id !== noteId);
    await localDb.saveNotes(nextNotes);
    set({ notes: nextNotes });
    deleteFromSupabase('notes', 'id', noteId).catch(() => {});
  },

  // ─── Persistent Focus Timer ─────────────────────────────────────────────
  startFocusTimer: async (targetMinutes, taskId) => {
    const timer = get().focusTimer;
    const minutes = targetMinutes ?? timer.targetMinutes;
    const updated: FocusTimerState = {
      ...timer,
      isRunning: true,
      isPaused: false,
      targetMinutes: minutes,
      startedAt: Date.now(),
      accumulatedMs: 0,
      taskId: taskId !== undefined ? taskId : timer.taskId,
    };
    await localDb.saveFocusTimer(updated);
    set({ focusTimer: updated });
  },

  pauseFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning || timer.isPaused || !timer.startedAt) return;
    const elapsedSinceStart = Date.now() - timer.startedAt;
    const updated: FocusTimerState = {
      ...timer,
      isPaused: true,
      accumulatedMs: timer.accumulatedMs + elapsedSinceStart,
      startedAt: null,
    };
    await localDb.saveFocusTimer(updated);
    set({ focusTimer: updated });
  },

  resumeFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning || !timer.isPaused) return;
    const updated: FocusTimerState = {
      ...timer,
      isPaused: false,
      startedAt: Date.now(),
    };
    await localDb.saveFocusTimer(updated);
    set({ focusTimer: updated });
  },

  resetFocusTimer: async () => {
    const timer = get().focusTimer;
    const updated: FocusTimerState = {
      ...timer,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      accumulatedMs: 0,
    };
    await localDb.saveFocusTimer(updated);
    set({ focusTimer: updated });
  },

  setFocusTargetMinutes: async (minutes: number) => {
    const timer = get().focusTimer;
    if (timer.isRunning) return;
    const updated: FocusTimerState = {
      ...timer,
      targetMinutes: minutes,
      accumulatedMs: 0,
      startedAt: null,
    };
    await localDb.saveFocusTimer(updated);
    set({ focusTimer: updated });
  },

  setFocusSelectedTaskId: (taskId?: string) => {
    set(state => ({ focusTimer: { ...state.focusTimer, taskId } }));
  },

  stopFocusTimer: async () => {
    const timer = get().focusTimer;
    if (!timer.isRunning) return null;

    let totalMs = timer.accumulatedMs;
    if (!timer.isPaused && timer.startedAt) {
      totalMs += Date.now() - timer.startedAt;
    }

    const actualMinutes = Math.max(1, Math.round(totalMs / 60000));
    const newSession: FocusSession = {
      id: `foc-${Date.now()}`,
      taskId: timer.taskId,
      startedAt: new Date().toISOString(),
      minutes: actualMinutes,
    };

    const updatedTimer: FocusTimerState = {
      ...timer,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      accumulatedMs: 0,
      completedSessions: [actualMinutes, ...timer.completedSessions],
    };

    // Award XP
    const xpEarned = Math.round(actualMinutes * 0.8);
    const profile = get().profile;
    const updatedProfile: Profile = {
      ...profile,
      totalXp: profile.totalXp + xpEarned,
      spendableXp: profile.spendableXp + xpEarned,
    };

    const existingSessions = await localDb.getFocusSessions();
    const nextSessions = [newSession, ...existingSessions];

    await localDb.saveFocusSessions(nextSessions);
    await localDb.saveFocusTimer(updatedTimer);
    await localDb.saveProfile(updatedProfile);

    set({
      focusTimer: updatedTimer,
      profile: updatedProfile,
    });

    syncWithSupabase().catch(() => {});
    return newSession;
  },

  logFocusSession: async (minutes: number, taskId?: string, subjectId?: string) => {
    const { profile } = get();
    const xpEarned = Math.round(minutes * 0.8);
    const updatedProfile = {
      ...profile,
      totalXp: profile.totalXp + xpEarned,
      spendableXp: profile.spendableXp + xpEarned,
    };

    const newSession: FocusSession = {
      id: `foc-${Date.now()}`,
      taskId,
      subjectId,
      startedAt: new Date().toISOString(),
      minutes,
    };

    const existingSessions = await localDb.getFocusSessions();
    await localDb.saveFocusSessions([newSession, ...existingSessions]);
    await localDb.saveProfile(updatedProfile);

    set({ profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  addGymSession: async (exercises) => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: GymSession = {
      id: `gym-${Date.now()}`,
      date: today,
      exercises,
    };
    const nextSessions = [newSession, ...get().gymSessions];
    const { profile } = get();
    const updatedProfile = {
      ...profile,
      totalXp: profile.totalXp + 50,
      spendableXp: profile.spendableXp + 50,
    };

    await localDb.saveGymSessions(nextSessions);
    await localDb.saveProfile(updatedProfile);
    set({ gymSessions: nextSessions, profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  logWeight: async (kg: number) => {
    const today = new Date().toISOString().split('T')[0];
    const nextLogs = [{ date: today, kg }, ...get().weightLogs.filter(l => l.date !== today)];
    await localDb.saveWeightLogs(nextLogs);
    set({ weightLogs: nextLogs });
    syncWithSupabase().catch(() => {});
  },

  addStudySession: async (subjectId: string, minutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: StudySession = {
      id: `study-${Date.now()}`,
      subjectId,
      date: today,
      minutes,
    };
    const nextSessions = [newSession, ...get().studySessions];
    const { profile } = get();
    const xp = Math.round(minutes * 0.5);
    const updatedProfile = {
      ...profile,
      totalXp: profile.totalXp + xp,
      spendableXp: profile.spendableXp + xp,
    };
    await localDb.saveStudySessions(nextSessions);
    await localDb.saveProfile(updatedProfile);
    set({ studySessions: nextSessions, profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  addSubject: async (name: string, weeklyTargetMin: number) => {
    const newSubject: StudySubject = {
      id: `sub-${Date.now()}`,
      name,
      weeklyTargetMin,
      archived: false,
    };
    const nextSubjects = [...get().studySubjects, newSubject];
    await localDb.saveStudySubjects(nextSubjects);
    set({ studySubjects: nextSubjects });
    syncWithSupabase().catch(() => {});
  },

  redeemReward: async (rewardId: string) => {
    const { rewards, profile, redemptions } = get();
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || profile.spendableXp < reward.cost) return false;

    const nextProfile = {
      ...profile,
      spendableXp: profile.spendableXp - reward.cost,
    };
    const nextRedemptions = [
      { id: `red-${Date.now()}`, rewardId, redeemedAt: new Date().toISOString() },
      ...redemptions,
    ];

    await localDb.saveProfile(nextProfile);
    await localDb.saveRedemptions(nextRedemptions);
    set({ profile: nextProfile, redemptions: nextRedemptions });
    syncWithSupabase().catch(() => {});
    return true;
  },

  addReward: async (title: string, cost: number) => {
    const newReward: Reward = {
      id: `rew-${Date.now()}`,
      title,
      cost,
      archived: false,
    };
    const nextRewards = [...get().rewards, newReward];
    await localDb.saveRewards(nextRewards);
    set({ rewards: nextRewards });
    syncWithSupabase().catch(() => {});
  },

  saveJournalEntry: async (text: string, mood: 1 | 2 | 3 | 4 | 5) => {
    const today = new Date().toISOString().split('T')[0];
    const nextEntries = [
      { date: today, text, mood },
      ...get().journalEntries.filter(j => j.date !== today),
    ];
    await localDb.saveJournal(nextEntries);
    set({ journalEntries: nextEntries });
    syncWithSupabase().catch(() => {});
  },

  triggerSync: async () => {
    set({ isSyncing: true, syncMessage: 'Syncing with Supabase...' });
    const result = await syncWithSupabase();
    set({
      isSyncing: false,
      syncMessage: result.message,
    });
  },

  updateProfile: async (partial: Partial<Profile>) => {
    const updated = { ...get().profile, ...partial };
    await localDb.saveProfile(updated);
    set({ profile: updated });
    syncWithSupabase().catch(() => {});
  },

  resetToSampleData: async () => {
    const sample = getSampleData();
    await localDb.saveTasks(sample.tasks);
    await localDb.saveGoals(sample.goals);
    await localDb.saveNotes(sample.notes);
    await localDb.saveStudySubjects(sample.studySubjects);
    await localDb.saveRewards(sample.rewards);
    await localDb.saveWeightLogs(sample.weightLogs);
    await localDb.saveGymSessions(sample.gymSessions);

    set({
      tasks: sample.tasks,
      goals: sample.goals,
      notes: sample.notes,
      studySubjects: sample.studySubjects,
      rewards: sample.rewards,
      weightLogs: sample.weightLogs,
      gymSessions: sample.gymSessions,
    });
    syncWithSupabase().catch(() => {});
  },
}));
