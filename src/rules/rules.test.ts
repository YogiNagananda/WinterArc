import { describe, it, expect } from 'vitest';
import {
  getLevel,
  getNextLevel,
  getLevelProgress,
  getTaskXp,
  getFocusXp,
  isDaySuccessful,
  isPerfectDay,
  calculateDayXp,
  computeStreak,
  canUseFreeze,
  getDayCompletionPercent,
  LEVELS,
  XP_TASK,
  XP_GOAL_COMPLETED,
  XP_FOCUS_PER_25_MIN,
  XP_PERFECT_DAY,
  type DayItems,
} from './rules';
import type { Task, Goal, TaskCompletion, DayRecord } from '../types';

// ─── XP Tests ────────────────────────────────────────────────────────────────

describe('XP Calculations', () => {
  it('should return correct XP for each priority', () => {
    expect(getTaskXp('low')).toBe(10);
    expect(getTaskXp('medium')).toBe(20);
    expect(getTaskXp('high')).toBe(30);
  });

  it('should calculate focus XP correctly', () => {
    expect(getFocusXp(0)).toBe(0);
    expect(getFocusXp(24)).toBe(0);
    expect(getFocusXp(25)).toBe(10);
    expect(getFocusXp(50)).toBe(20);
    expect(getFocusXp(75)).toBe(30);
    expect(getFocusXp(100)).toBe(40);
  });
});

// ─── Level Tests ─────────────────────────────────────────────────────────────

describe('Levels', () => {
  it('should return Rookie for 0 XP', () => {
    expect(getLevel(0).name).toBe('Rookie');
  });

  it('should return Grinder for 300 XP', () => {
    expect(getLevel(300).name).toBe('Grinder');
  });

  it('should return Disciplined for 800 XP', () => {
    expect(getLevel(800).name).toBe('Disciplined');
  });

  it('should return Beast for 1800 XP', () => {
    expect(getLevel(1800).name).toBe('Beast');
  });

  it('should return Legend for 3500 XP', () => {
    expect(getLevel(3500).name).toBe('Legend');
  });

  it('should return Legend for XP above 3500', () => {
    expect(getLevel(10000).name).toBe('Legend');
  });

  it('should return correct next level', () => {
    expect(getNextLevel(0)?.name).toBe('Grinder');
    expect(getNextLevel(300)?.name).toBe('Disciplined');
    expect(getNextLevel(3500)).toBeNull();
  });

  it('should calculate level progress correctly', () => {
    expect(getLevelProgress(0)).toBe(0);
    expect(getLevelProgress(150)).toBe(50);
    expect(getLevelProgress(300)).toBe(0);
    expect(getLevelProgress(3500)).toBe(100);
  });
});

// ─── Day Success (70% Rule) Tests ────────────────────────────────────────────

describe('Day Success (70% Rule)', () => {
  const makeTask = (id: string): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    category: 'Work',
    priority: 'medium',
    startDate: '2026-10-01',
    startTime: '09:00',
    durationMin: 30,
    repeat: { type: 'none', days: [] },
    reminder: 'none',
    xp: 20,
    archived: false,
    createdAt: new Date().toISOString(),
  });

  const makeGoal = (id: string): Goal => ({
    id,
    title: `Goal ${id}`,
    type: 'checkbox',
    target: 1,
    step: 1,
    unit: '',
    icon: '🎯',
    archived: false,
    createdAt: new Date().toISOString(),
  });

  it('should return false when no items are scheduled', () => {
    const items: DayItems = {
      scheduledTasks: [],
      completedTaskIds: new Set(),
      goals: [],
      goalLogs: new Map(),
    };
    expect(isDaySuccessful(items)).toBe(false);
  });

  it('should return true when >= 70% completed (7 of 10)', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => makeTask(`t${i}`));
    const items: DayItems = {
      scheduledTasks: tasks,
      completedTaskIds: new Set(tasks.slice(0, 7).map(t => t.id)),
      goals: [],
      goalLogs: new Map(),
    };
    expect(isDaySuccessful(items)).toBe(true);
  });

  it('should return false when < 70% completed (6 of 10)', () => {
    const tasks = Array.from({ length: 10 }, (_, i) => makeTask(`t${i}`));
    const items: DayItems = {
      scheduledTasks: tasks,
      completedTaskIds: new Set(tasks.slice(0, 6).map(t => t.id)),
      goals: [],
      goalLogs: new Map(),
    };
    expect(isDaySuccessful(items)).toBe(false);
  });

  it('should include goals in the 70% calculation', () => {
    const tasks = [makeTask('t1'), makeTask('t2'), makeTask('t3')];
    const goals = [makeGoal('g1'), makeGoal('g2')];
    // Total items = 5, need at least 4 (70% of 5 = 3.5 → ≥ 3.5 means 4)
    // Actually 3.5/5 = 70%, so 3.5 is exactly 70%, rounding: 3/5 = 60% < 70%, 4/5 = 80% >= 70%
    // Wait, 3.5/5 = 0.7, but we need integers. 3/5 = 0.6 < 0.7, 4/5 = 0.8 >= 0.7
    // Hmm let's check: 7/10 = 0.7 which is exactly >= 0.7

    // With 5 items, need ceil(3.5) = 4? No, 3.5/5 = 0.7 so exactly 70%
    // But we need integer completions. So 3/5 = 60% (fail), 4/5 = 80% (pass)
    // The 70% threshold is >= 0.7. With 5 items we need 4.

    // Let's test: 3 tasks + 1 goal completed out of 5 = 4/5 = 0.8 >= 0.7 ✓
    const items: DayItems = {
      scheduledTasks: tasks,
      completedTaskIds: new Set(['t1', 't2', 't3']),
      goals,
      goalLogs: new Map([['g1', 1]]),
    };
    expect(isDaySuccessful(items)).toBe(true); // 4/5 = 80%
  });

  it('should handle counter goals correctly', () => {
    const goal: Goal = {
      id: 'g1',
      title: 'Water',
      type: 'counter',
      target: 8,
      step: 1,
      unit: 'glasses',
      icon: '💧',
      archived: false,
      createdAt: new Date().toISOString(),
    };

    const items: DayItems = {
      scheduledTasks: [],
      completedTaskIds: new Set(),
      goals: [goal],
      goalLogs: new Map([['g1', 8]]),
    };
    expect(isDaySuccessful(items)).toBe(true);

    const itemsIncomplete: DayItems = {
      ...items,
      goalLogs: new Map([['g1', 7]]),
    };
    expect(isDaySuccessful(itemsIncomplete)).toBe(false);
  });
});

// ─── Perfect Day Tests ───────────────────────────────────────────────────────

describe('Perfect Day', () => {
  it('should be true only when 100% completed', () => {
    const task: Task = {
      id: 't1', title: 'T', description: '', category: 'Work', priority: 'high',
      startDate: '2026-10-01', startTime: '09:00', durationMin: 30,
      repeat: { type: 'none', days: [] }, reminder: 'none', xp: 30,
      archived: false, createdAt: new Date().toISOString(),
    };

    const items: DayItems = {
      scheduledTasks: [task],
      completedTaskIds: new Set(['t1']),
      goals: [],
      goalLogs: new Map(),
    };
    expect(isPerfectDay(items)).toBe(true);
  });

  it('should be false when not all items completed', () => {
    const task1: Task = {
      id: 't1', title: 'T1', description: '', category: 'Work', priority: 'high',
      startDate: '2026-10-01', startTime: '09:00', durationMin: 30,
      repeat: { type: 'none', days: [] }, reminder: 'none', xp: 30,
      archived: false, createdAt: new Date().toISOString(),
    };
    const task2: Task = {
      id: 't2', title: 'T2', description: '', category: 'Work', priority: 'medium',
      startDate: '2026-10-01', startTime: '10:00', durationMin: 30,
      repeat: { type: 'none', days: [] }, reminder: 'none', xp: 20,
      archived: false, createdAt: new Date().toISOString(),
    };

    const items: DayItems = {
      scheduledTasks: [task1, task2],
      completedTaskIds: new Set(['t1']),
      goals: [],
      goalLogs: new Map(),
    };
    expect(isPerfectDay(items)).toBe(false);
  });
});

// ─── Streak Tests ────────────────────────────────────────────────────────────

describe('Streak', () => {
  it('should compute streak from consecutive successful days', () => {
    const records: DayRecord[] = [
      { date: '2026-10-01', successful: true, xpEarned: 100, freezeUsed: false },
      { date: '2026-10-02', successful: true, xpEarned: 80, freezeUsed: false },
      { date: '2026-10-03', successful: true, xpEarned: 90, freezeUsed: false },
    ];
    const result = computeStreak(records, 0, 0);
    expect(result.streak).toBe(3);
    expect(result.bestStreak).toBe(3);
  });

  it('should break streak on unsuccessful day', () => {
    const records: DayRecord[] = [
      { date: '2026-10-01', successful: true, xpEarned: 100, freezeUsed: false },
      { date: '2026-10-02', successful: false, xpEarned: 20, freezeUsed: false },
      { date: '2026-10-03', successful: true, xpEarned: 90, freezeUsed: false },
    ];
    const result = computeStreak(records, 0, 0);
    expect(result.streak).toBe(1); // Only the last successful day
  });

  it('should count freeze-used days as streak continuation', () => {
    const records: DayRecord[] = [
      { date: '2026-10-01', successful: true, xpEarned: 100, freezeUsed: false },
      { date: '2026-10-02', successful: false, xpEarned: 0, freezeUsed: true },
      { date: '2026-10-03', successful: true, xpEarned: 90, freezeUsed: false },
    ];
    const result = computeStreak(records, 0, 0);
    expect(result.streak).toBe(3);
  });

  it('should preserve best streak', () => {
    const records: DayRecord[] = [
      { date: '2026-10-05', successful: true, xpEarned: 100, freezeUsed: false },
    ];
    const result = computeStreak(records, 0, 10); // previous best was 10
    expect(result.bestStreak).toBe(10);
  });
});

// ─── Streak Freeze Tests ─────────────────────────────────────────────────────

describe('Streak Freeze', () => {
  it('should have 1 freeze per week', () => {
    const result = canUseFreeze(1, '2026-W40', '2026-W40');
    expect(result.available).toBe(true);
    expect(result.freezesLeft).toBe(1);
  });

  it('should not allow freeze when used up', () => {
    const result = canUseFreeze(0, '2026-W40', '2026-W40');
    expect(result.available).toBe(false);
  });

  it('should reset on new week', () => {
    const result = canUseFreeze(0, '2026-W40', '2026-W41');
    expect(result.available).toBe(true);
    expect(result.freezesLeft).toBe(1);
  });
});

// ─── Day Completion Percent Tests ────────────────────────────────────────────

describe('Day Completion Percent', () => {
  it('should return 0 for no items', () => {
    const items: DayItems = {
      scheduledTasks: [],
      completedTaskIds: new Set(),
      goals: [],
      goalLogs: new Map(),
    };
    expect(getDayCompletionPercent(items)).toBe(0);
  });

  it('should return 50 for half completed', () => {
    const task1: Task = {
      id: 't1', title: 'T1', description: '', category: 'Work', priority: 'medium',
      startDate: '2026-10-01', startTime: '', durationMin: 30,
      repeat: { type: 'none', days: [] }, reminder: 'none', xp: 20,
      archived: false, createdAt: '',
    };
    const task2: Task = {
      id: 't2', title: 'T2', description: '', category: 'Work', priority: 'medium',
      startDate: '2026-10-01', startTime: '', durationMin: 30,
      repeat: { type: 'none', days: [] }, reminder: 'none', xp: 20,
      archived: false, createdAt: '',
    };
    const items: DayItems = {
      scheduledTasks: [task1, task2],
      completedTaskIds: new Set(['t1']),
      goals: [],
      goalLogs: new Map(),
    };
    expect(getDayCompletionPercent(items)).toBe(50);
  });
});

// ─── Day Rollover Tests ─────────────────────────────────────────────────────

describe('Day Rollover', () => {
  // These test the concept; actual getEffectiveToday depends on system clock
  // so we test the underlying logic

  it('getArcDay should return correct day number', () => {
    // Test via import
    const { getArcDay } = require('../utils/dates');
    expect(getArcDay('2026-10-01', 90, '2026-10-01')).toBe(1);
    expect(getArcDay('2026-10-01', 90, '2026-10-15')).toBe(15);
    expect(getArcDay('2026-10-01', 90, '2026-12-30')).toBe(91); // arcLength + 1
    expect(getArcDay('2026-10-01', 90, '2026-09-30')).toBe(0); // before start
  });

  it('isTaskScheduledForDate should handle daily recurring tasks', () => {
    const { isTaskScheduledForDate } = require('../utils/dates');
    const task = {
      startDate: '2026-10-01',
      repeat: { type: 'daily', days: [] },
      archived: false,
    };
    expect(isTaskScheduledForDate(task, '2026-10-01')).toBe(true);
    expect(isTaskScheduledForDate(task, '2026-10-05')).toBe(true);
    expect(isTaskScheduledForDate(task, '2026-09-30')).toBe(false); // before start
  });

  it('isTaskScheduledForDate should handle weekday recurring tasks', () => {
    const { isTaskScheduledForDate } = require('../utils/dates');
    const task = {
      startDate: '2026-10-01',
      repeat: { type: 'weekdays', days: [] },
      archived: false,
    };
    // Oct 1, 2026 is a Thursday
    expect(isTaskScheduledForDate(task, '2026-10-01')).toBe(true); // Thu
    expect(isTaskScheduledForDate(task, '2026-10-02')).toBe(true); // Fri
    expect(isTaskScheduledForDate(task, '2026-10-03')).toBe(false); // Sat
    expect(isTaskScheduledForDate(task, '2026-10-04')).toBe(false); // Sun
    expect(isTaskScheduledForDate(task, '2026-10-05')).toBe(true); // Mon
  });

  it('isTaskScheduledForDate should not show archived tasks', () => {
    const { isTaskScheduledForDate } = require('../utils/dates');
    const task = {
      startDate: '2026-10-01',
      repeat: { type: 'daily', days: [] },
      archived: true,
    };
    expect(isTaskScheduledForDate(task, '2026-10-01')).toBe(false);
  });
});
