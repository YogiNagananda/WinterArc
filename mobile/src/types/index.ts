// WinterArc Master Type Definitions for Mobile

export type Priority = 'low' | 'medium' | 'high';
export type RepeatType = 'none' | 'daily' | 'weekdays' | 'weekly';
export type TaskCategory = 'Gym' | 'Study' | 'Health' | 'Work' | 'Personal' | string;

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm or ''
  durationMin: number;
  repeatType: RepeatType;
  repeatDays: number[];
  reminder: string;
  xp: number;
  archived: boolean;
  createdAt: string;
}

export interface TaskCompletion {
  id?: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  completedAt: string;
  actualMinutes: number;
}

export type GoalType = 'checkbox' | 'counter' | 'time';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  target: number;
  step: number;
  unit: string;
  icon: string;
  archived: boolean;
  createdAt: string;
}

export interface GoalLog {
  goalId: string;
  date: string; // YYYY-MM-DD
  value: number;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  subjectId?: string;
  startedAt: string;
  minutes: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  checklist: ChecklistItem[];
  tags: string[];
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  text: string;
  mood: 1 | 2 | 3 | 4 | 5;
}

export interface GymSet {
  reps: number;
  weight: number;
}

export interface GymExercise {
  name: string;
  sets: GymSet[];
}

export interface GymSession {
  id: string;
  date: string; // YYYY-MM-DD
  exercises: GymExercise[];
}

export interface BodyWeightLog {
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface StudySubject {
  id: string;
  name: string;
  weeklyTargetMin: number;
  archived: boolean;
}

export interface StudySession {
  id: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  archived: boolean;
}

export interface Redemption {
  id: string;
  rewardId: string;
  redeemedAt: string;
}

export interface Profile {
  startDate: string; // YYYY-MM-DD
  arcLength: number; // 90
  rolloverHour: number;
  totalXp: number;
  spendableXp: number;
  streak: number;
  bestStreak: number;
  freezesLeft: number;
  freezeResetWeek: string;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  sampleDataLoaded: boolean;
}

export interface DayRecord {
  date: string; // YYYY-MM-DD
  successful: boolean;
  xpEarned: number;
  freezeUsed: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface FocusTimerState {
  isRunning: boolean;
  isPaused: boolean;
  targetMinutes: number;
  startedAt: number | null; // Date.now() timestamp
  accumulatedMs: number;
  taskId?: string;
  completedSessions: number[];
}

