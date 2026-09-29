// ─── WINTER ARC – Master Type Definitions ───────────────────────────────────

// ─── Task ────────────────────────────────────────────────────────────────────
export type Priority = 'low' | 'medium' | 'high';
export type RepeatType = 'none' | 'daily' | 'weekdays' | 'weekly';
export type ReminderType = 'none' | 'at_time' | '10_min_before';
export type TaskCategory = 'Gym' | 'Study' | 'Health' | 'Work' | 'Personal' | string;

export interface TaskRepeat {
  type: RepeatType;
  days: number[]; // 0=Sun..6=Sat, used when type='weekly'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: Priority;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm or ''
  durationMin: number;
  repeat: TaskRepeat;
  reminder: ReminderType;
  xp: number;
  archived: boolean;
  createdAt: string; // ISO timestamp
}

export interface TaskCompletion {
  taskId: string;
  date: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
  actualMinutes: number;
}

// ─── Goal ────────────────────────────────────────────────────────────────────
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

// ─── Focus ───────────────────────────────────────────────────────────────────
export interface FocusSession {
  id: string;
  taskId?: string;
  subjectId?: string;
  startedAt: string; // ISO timestamp
  minutes: number;
}

export interface FocusTimerState {
  isRunning: boolean;
  isPaused: boolean;
  taskId?: string;
  subjectId?: string;
  startedAt?: string; // ISO – when the current segment started
  accumulatedMs: number; // ms accumulated from previous segments
  targetMinutes: number;
}

// ─── Notes ───────────────────────────────────────────────────────────────────
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

// ─── Gym ─────────────────────────────────────────────────────────────────────
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

// ─── Study ───────────────────────────────────────────────────────────────────
export interface Subject {
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

// ─── Rewards ─────────────────────────────────────────────────────────────────
export interface Reward {
  id: string;
  title: string;
  cost: number;
  archived: boolean;
}

export interface Redemption {
  id: string;
  rewardId: string;
  redeemedAt: string; // ISO timestamp
}

// ─── Badges ──────────────────────────────────────────────────────────────────
export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string; // key to check in badge evaluation
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string; // ISO timestamp
}

// ─── Day Record ──────────────────────────────────────────────────────────────
export interface DayRecord {
  date: string; // YYYY-MM-DD
  successful: boolean;
  xpEarned: number;
  freezeUsed: boolean;
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export interface Profile {
  startDate: string; // YYYY-MM-DD
  arcLength: number;
  rolloverHour: number; // 0-23, default 4
  totalXp: number;
  spendableXp: number;
  streak: number;
  bestStreak: number;
  freezesLeft: number;
  freezeResetWeek: string; // ISO week identifier YYYY-Www
  schemaVersion: number;
  theme: 'dark' | 'light';
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  lastBackupReminder: string; // ISO timestamp
  sampleDataLoaded: boolean;
}

// ─── Weekly Review ───────────────────────────────────────────────────────────
export interface WeeklyReview {
  weekId: string; // YYYY-Www
  summary: string; // auto-generated
  improvement: string; // user-typed
  createdAt: string;
}

// ─── Gym Split ───────────────────────────────────────────────────────────────
export interface GymSplitDay {
  day: number; // 0=Sun..6=Sat
  label: string; // e.g. "Push", "Pull", "Legs", "Rest"
}

export interface GymSplit {
  name: string;
  days: GymSplitDay[];
}

// ─── Level ───────────────────────────────────────────────────────────────────
export interface Level {
  name: string;
  minXp: number;
}

// ─── Settings for notes PIN ──────────────────────────────────────────────────
export interface NotesPinConfig {
  enabled: boolean;
  hash: string; // SHA-256 hex of the PIN
  salt: string;
}

// ─── Quote ───────────────────────────────────────────────────────────────────
export interface Quote {
  text: string;
  author: string;
}

export interface FavoriteQuote {
  index: number; // index into the quotes array
  favoritedAt: string;
}
