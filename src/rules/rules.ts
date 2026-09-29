// ─── WINTER ARC – Game Rules Engine ──────────────────────────────────────────
// All XP, streak, level, and day-success logic lives here.

import type { Level, Priority, TaskCompletion, GoalLog, Goal, Task, FocusSession, DayRecord } from '../types';

// ─── XP Values ───────────────────────────────────────────────────────────────
export const XP_TASK: Record<Priority, number> = {
  low: 10,
  medium: 20,
  high: 30,
};

export const XP_GOAL_COMPLETED = 15;
export const XP_FOCUS_PER_25_MIN = 10;
export const XP_PERFECT_DAY = 50;

// ─── Levels ──────────────────────────────────────────────────────────────────
export const LEVELS: Level[] = [
  { name: 'Rookie', minXp: 0 },
  { name: 'Grinder', minXp: 300 },
  { name: 'Disciplined', minXp: 800 },
  { name: 'Beast', minXp: 1800 },
  { name: 'Legend', minXp: 3500 },
];

/**
 * Get the current level for a given total XP.
 */
export function getLevel(totalXp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

/**
 * Get the next level (or null if max).
 */
export function getNextLevel(totalXp: number): Level | null {
  const current = getLevel(totalXp);
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

/**
 * Progress percentage to the next level (0-100).
 */
export function getLevelProgress(totalXp: number): number {
  const current = getLevel(totalXp);
  const next = getNextLevel(totalXp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const progress = totalXp - current.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

/**
 * Calculate XP for completing a task.
 */
export function getTaskXp(priority: Priority): number {
  return XP_TASK[priority];
}

/**
 * Calculate XP earned from focus sessions for a day.
 * Each complete 25 minutes earns 10 XP.
 */
export function getFocusXp(totalMinutes: number): number {
  return Math.floor(totalMinutes / 25) * XP_FOCUS_PER_25_MIN;
}

// ─── Day Success ─────────────────────────────────────────────────────────────

export interface DayItems {
  scheduledTasks: Task[];
  completedTaskIds: Set<string>;
  goals: Goal[];
  goalLogs: Map<string, number>; // goalId → value for that day
}

/**
 * Check if a day is "successful": ≥70% of scheduled tasks AND daily goals completed,
 * and at least 1 item was scheduled.
 */
export function isDaySuccessful(items: DayItems): boolean {
  const totalItems = items.scheduledTasks.length + items.goals.length;
  if (totalItems === 0) return false;

  const completedTasks = items.scheduledTasks.filter(t =>
    items.completedTaskIds.has(t.id),
  ).length;

  const completedGoals = items.goals.filter(g => {
    const log = items.goalLogs.get(g.id) ?? 0;
    if (g.type === 'checkbox') return log >= 1;
    return log >= g.target;
  }).length;

  const completedTotal = completedTasks + completedGoals;
  return completedTotal / totalItems >= 0.7;
}

/**
 * Check if a day is a "Perfect Day": 100% of tasks AND goals completed.
 */
export function isPerfectDay(items: DayItems): boolean {
  const totalItems = items.scheduledTasks.length + items.goals.length;
  if (totalItems === 0) return false;

  const completedTasks = items.scheduledTasks.filter(t =>
    items.completedTaskIds.has(t.id),
  ).length;

  const completedGoals = items.goals.filter(g => {
    const log = items.goalLogs.get(g.id) ?? 0;
    if (g.type === 'checkbox') return log >= 1;
    return log >= g.target;
  }).length;

  return completedTasks + completedGoals === totalItems;
}

/**
 * Calculate total XP earned for a day.
 */
export function calculateDayXp(
  completions: TaskCompletion[],
  tasks: Task[],
  focusMinutes: number,
  items: DayItems,
): number {
  let xp = 0;

  // Task XP
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  for (const c of completions) {
    const task = taskMap.get(c.taskId);
    if (task) xp += getTaskXp(task.priority);
  }

  // Goal XP
  for (const g of items.goals) {
    const log = items.goalLogs.get(g.id) ?? 0;
    const completed = g.type === 'checkbox' ? log >= 1 : log >= g.target;
    if (completed) xp += XP_GOAL_COMPLETED;
  }

  // Focus XP
  xp += getFocusXp(focusMinutes);

  // Perfect Day bonus
  if (isPerfectDay(items)) xp += XP_PERFECT_DAY;

  return xp;
}

// ─── Streak ──────────────────────────────────────────────────────────────────

/**
 * Update streak based on day records.
 * Returns { streak, bestStreak, freezeUsed }.
 */
export function computeStreak(
  dayRecords: DayRecord[],
  currentStreak: number,
  bestStreak: number,
): { streak: number; bestStreak: number } {
  // Sort chronologically
  const sorted = [...dayRecords].sort((a, b) => a.date.localeCompare(b.date));

  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const record = sorted[i];
    if (record.successful || record.freezeUsed) {
      streak++;
    } else {
      break;
    }
  }

  return {
    streak,
    bestStreak: Math.max(bestStreak, streak),
  };
}

/**
 * Check if a streak freeze is available this week.
 * Freezes reset on Monday (1 per week).
 */
export function canUseFreeze(
  freezesLeft: number,
  freezeResetWeek: string,
  currentWeek: string,
): { available: boolean; freezesLeft: number } {
  if (freezeResetWeek !== currentWeek) {
    // New week, reset
    return { available: true, freezesLeft: 1 };
  }
  return { available: freezesLeft > 0, freezesLeft };
}

// ─── Completion Percentage ───────────────────────────────────────────────────

/**
 * Calculate completion percentage for a day.
 */
export function getDayCompletionPercent(items: DayItems): number {
  const totalItems = items.scheduledTasks.length + items.goals.length;
  if (totalItems === 0) return 0;

  const completedTasks = items.scheduledTasks.filter(t =>
    items.completedTaskIds.has(t.id),
  ).length;

  const completedGoals = items.goals.filter(g => {
    const log = items.goalLogs.get(g.id) ?? 0;
    if (g.type === 'checkbox') return log >= 1;
    return log >= g.target;
  }).length;

  return Math.round(((completedTasks + completedGoals) / totalItems) * 100);
}
