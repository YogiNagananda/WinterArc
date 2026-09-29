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
  GymPhoto,
} from '../types';
import { localDb, defaultProfile, defaultFocusTimer } from '../lib/storage';
import { getSampleData } from '../lib/sampleData';
import { syncWithSupabase, deleteFromSupabase, pullFromSupabase } from '../lib/syncEngine';
import { playHardCompletionSound, playCelebrationSound, playInitiationGong } from '../lib/soundPlayer';

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
  gymPhotos: GymPhoto[];
  weightLogs: BodyWeightLog[];
  studySubjects: StudySubject[];
  studySessions: StudySession[];
  rewards: Reward[];
  redemptions: Redemption[];
  dayRecords: DayRecord[];
  focusTimer: FocusTimerState;
  isSyncing: boolean;
  syncMessage: string;
  fullDayClearedToast: string;

  // Actions
  initialize: () => Promise<void>;
  setActiveTab: (tab: ScreenTab) => void;
  acceptChallenge: () => Promise<void>;
  clearFullDayToast: () => void;
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
  addGymPhoto: (photo: Omit<GymPhoto, 'id' | 'createdAt'>) => Promise<void>;
  deleteGymPhoto: (photoId: string) => Promise<void>;
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
  gymPhotos: [],
  weightLogs: [],
  studySubjects: [],
  studySessions: [],
  rewards: [],
  redemptions: [],
  dayRecords: [],
  focusTimer: defaultFocusTimer,
  isSyncing: false,
  syncMessage: '',
  fullDayClearedToast: '',

  initialize: async () => {
    const profile = await localDb.getProfile();
    let tasks = await localDb.getTasks();
    let goals = await localDb.getGoals();
    let notes = await localDb.getNotes();
    let gymSessions = await localDb.getGymSessions();
    let gymPhotos = await localDb.getGymPhotos();
    let weightLogs = await localDb.getWeightLogs();
    let studySubjects = await localDb.getStudySubjects();
    let rewards = await localDb.getRewards();
    const focusTimer = await localDb.getFocusTimer();

    // Check if cloud has data or if initial sample data needed
    if (!profile.sampleDataLoaded && tasks.length === 0) {
      await pullFromSupabase();
      tasks = await localDb.getTasks();
      goals = await localDb.getGoals();
      notes = await localDb.getNotes();

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

    // Ensure entertainment rewards (video games, movies, series) are present
    const sampleRewards = getSampleData().rewards;
    const existingRewardTitles = new Set(rewards.map(r => r.title.toLowerCase()));
    let rewardsChanged = false;
    for (const sr of sampleRewards) {
      if (!existingRewardTitles.has(sr.title.toLowerCase())) {
        rewards.push(sr);
        rewardsChanged = true;
      }
    }
    if (rewardsChanged) {
      await localDb.saveRewards(rewards);
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
      gymPhotos,
      weightLogs,
      studySubjects,
      studySessions,
      rewards,
      redemptions,
      dayRecords,
      focusTimer,
    });

    get().triggerSync();
  },

  setActiveTab: (tab: ScreenTab) => set({ activeTab: tab }),

  clearFullDayToast: () => set({ fullDayClearedToast: '' }),

  acceptChallenge: async () => {
    const profile = get().profile;
    const today = new Date().toISOString().split('T')[0];
    const updatedProfile: Profile = {
      ...profile,
      streak: 1, // Streak shifts from 0 to 1 on joining
      bestStreak: Math.max(1, profile.bestStreak),
      totalXp: profile.totalXp + 100, // Initiation bonus XP
      spendableXp: profile.spendableXp + 100,
      challengeAccepted: true,
      startDate: today,
    };

    await localDb.saveProfile(updatedProfile);
    set({
      profile: updatedProfile,
      fullDayClearedToast: '⚔️ WINTER ARC ACCEPTED! Streak is now 1. +100 XP & Initiation Badges Unlocked!',
    });
    playInitiationGong();
    syncWithSupabase().catch(() => {});
  },

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

    let nextTotalXp = Math.max(0, profile.totalXp + xpDelta);
    let nextSpendableXp = Math.max(0, profile.spendableXp + xpDelta);
    let updatedProfile = { ...profile, totalXp: nextTotalXp, spendableXp: nextSpendableXp };

    // Check if ALL active tasks for today are now completed!
    const todayTasks = tasks.filter(t => !t.archived);
    const nextCompletedIds = new Set(nextCompletions.filter(c => c.date === date).map(c => c.taskId));
    const allDone = todayTasks.length > 0 && todayTasks.every(t => nextCompletedIds.has(t.id));

    if (allDone && existingIndex < 0) {
      // Full Day Cleared Bonus! +100 Spendable XP to shop for video games/movies
      updatedProfile = {
        ...updatedProfile,
        totalXp: updatedProfile.totalXp + 100,
        spendableXp: updatedProfile.spendableXp + 100,
      };
      playCelebrationSound();
      set({
        fullDayClearedToast: '👑 FULL DAY CLEARED! +100 Spendable XP Earned! Ready to shop rewards for video games or movies!',
      });
    }

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

    // Award bonus XP if goal achieved today (e.g. reading a book!)
    let updatedProfile = profile;
    if (nextVal >= goal.target && currentVal < goal.target) {
      const isReading = goal.title.toLowerCase().includes('read') || goal.title.toLowerCase().includes('book');
      const bonusXp = isReading ? 100 : 50;
      updatedProfile = {
        ...profile,
        totalXp: profile.totalXp + bonusXp,
        spendableXp: profile.spendableXp + bonusXp,
      };
      await localDb.saveProfile(updatedProfile);
      playCelebrationSound();
      if (isReading) {
        set({
          fullDayClearedToast: '📚 Book Goal Completed! +100 Spendable XP Earned! Head to the Rewards Shop for guilt-free gaming & movie time!',
        });
      }
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
    const minutes = Math.max(1, targetMinutes ?? timer.targetMinutes ?? 25);
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
      accumulatedMs: (timer.accumulatedMs || 0) + elapsedSinceStart,
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
    const safeMin = Math.max(1, Math.min(240, minutes));
    const updated: FocusTimerState = {
      ...timer,
      targetMinutes: safeMin,
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

    let totalMs = timer.accumulatedMs || 0;
    if (!timer.isPaused && timer.startedAt) {
      totalMs += Math.max(0, Date.now() - timer.startedAt);
    }

    const maxTargetMs = (timer.targetMinutes || 25) * 60 * 1000;
    const boundedMs = Math.min(totalMs, maxTargetMs);
    const actualMinutes = Math.max(1, Math.min(timer.targetMinutes || 25, Math.round(boundedMs / 60000)));

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
      completedSessions: [actualMinutes, ...(timer.completedSessions || [])],
    };

    // Award XP
    const xpEarned = Math.max(5, Math.round(actualMinutes * 0.8));
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

    // Hard completion battle sound & vibration
    playHardCompletionSound();

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

    playHardCompletionSound();

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
    playCelebrationSound();
    set({ gymSessions: nextSessions, profile: updatedProfile });
    syncWithSupabase().catch(() => {});
  },

  addGymPhoto: async (photoInput) => {
    const newPhoto: GymPhoto = {
      ...photoInput,
      id: `photo-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const nextPhotos = [newPhoto, ...get().gymPhotos];
    await localDb.saveGymPhotos(nextPhotos);
    set({ gymPhotos: nextPhotos });
    syncWithSupabase().catch(() => {});
  },

  deleteGymPhoto: async (photoId: string) => {
    const nextPhotos = get().gymPhotos.filter(p => p.id !== photoId);
    await localDb.saveGymPhotos(nextPhotos);
    set({ gymPhotos: nextPhotos });
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
    playCelebrationSound();
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
