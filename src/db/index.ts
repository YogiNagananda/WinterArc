// ─── IndexedDB Layer using idb ───────────────────────────────────────────────
import { openDB, type IDBPDatabase } from 'idb';
import type {
  Task,
  TaskCompletion,
  Goal,
  GoalLog,
  FocusSession,
  Note,
  JournalEntry,
  GymSession,
  BodyWeightLog,
  Subject,
  StudySession,
  Reward,
  Redemption,
  DayRecord,
  Profile,
  WeeklyReview,
  EarnedBadge,
  FavoriteQuote,
  NotesPinConfig,
  GymSplit,
} from '../types';

const DB_NAME = 'winter-arc';
const DB_VERSION = 1;

export type WinterArcDB = IDBPDatabase;

let dbInstance: WinterArcDB | null = null;

export async function getDB(): Promise<WinterArcDB> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Profile (single record)
      if (!db.objectStoreNames.contains('profile')) {
        db.createObjectStore('profile');
      }

      // Tasks
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }

      // Task completions (compound key: taskId + date)
      if (!db.objectStoreNames.contains('taskCompletions')) {
        const store = db.createObjectStore('taskCompletions', {
          keyPath: ['taskId', 'date'],
        });
        store.createIndex('byDate', 'date');
        store.createIndex('byTask', 'taskId');
      }

      // Goals
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }

      // Goal logs (compound key: goalId + date)
      if (!db.objectStoreNames.contains('goalLogs')) {
        const store = db.createObjectStore('goalLogs', {
          keyPath: ['goalId', 'date'],
        });
        store.createIndex('byDate', 'date');
        store.createIndex('byGoal', 'goalId');
      }

      // Focus sessions
      if (!db.objectStoreNames.contains('focusSessions')) {
        const store = db.createObjectStore('focusSessions', { keyPath: 'id' });
        store.createIndex('byDate', 'startedAt');
      }

      // Notes
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }

      // Journal entries
      if (!db.objectStoreNames.contains('journalEntries')) {
        db.createObjectStore('journalEntries', { keyPath: 'date' });
      }

      // Gym sessions
      if (!db.objectStoreNames.contains('gymSessions')) {
        const store = db.createObjectStore('gymSessions', { keyPath: 'id' });
        store.createIndex('byDate', 'date');
      }

      // Body weight logs
      if (!db.objectStoreNames.contains('bodyWeightLogs')) {
        db.createObjectStore('bodyWeightLogs', { keyPath: 'date' });
      }

      // Subjects
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'id' });
      }

      // Study sessions
      if (!db.objectStoreNames.contains('studySessions')) {
        const store = db.createObjectStore('studySessions', { keyPath: 'id' });
        store.createIndex('byDate', 'date');
        store.createIndex('bySubject', 'subjectId');
      }

      // Rewards
      if (!db.objectStoreNames.contains('rewards')) {
        db.createObjectStore('rewards', { keyPath: 'id' });
      }

      // Redemptions
      if (!db.objectStoreNames.contains('redemptions')) {
        const store = db.createObjectStore('redemptions', { keyPath: 'id' });
        store.createIndex('byReward', 'rewardId');
      }

      // Day records
      if (!db.objectStoreNames.contains('dayRecords')) {
        db.createObjectStore('dayRecords', { keyPath: 'date' });
      }

      // Weekly reviews
      if (!db.objectStoreNames.contains('weeklyReviews')) {
        db.createObjectStore('weeklyReviews', { keyPath: 'weekId' });
      }

      // Earned badges
      if (!db.objectStoreNames.contains('earnedBadges')) {
        db.createObjectStore('earnedBadges', { keyPath: 'badgeId' });
      }

      // Favorite quotes
      if (!db.objectStoreNames.contains('favoriteQuotes')) {
        db.createObjectStore('favoriteQuotes', { keyPath: 'index' });
      }

      // Focus timer state
      if (!db.objectStoreNames.contains('focusTimerState')) {
        db.createObjectStore('focusTimerState');
      }

      // Notes PIN config
      if (!db.objectStoreNames.contains('notesPinConfig')) {
        db.createObjectStore('notesPinConfig');
      }

      // Gym split
      if (!db.objectStoreNames.contains('gymSplit')) {
        db.createObjectStore('gymSplit');
      }
    },
  });

  return dbInstance;
}

// ─── Generic CRUD helpers ────────────────────────────────────────────────────

export async function getAll<T>(storeName: string): Promise<T[]> {
  const db = await getDB();
  return db.getAll(storeName);
}

export async function getByKey<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await getDB();
  return db.get(storeName, key);
}

export async function putItem<T>(storeName: string, item: T, key?: IDBValidKey): Promise<void> {
  const db = await getDB();
  if (key !== undefined) {
    await db.put(storeName, item, key);
  } else {
    await db.put(storeName, item);
  }
}

export async function deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
  const db = await getDB();
  await db.delete(storeName, key);
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await getDB();
  await db.clear(storeName);
}

export async function getAllByIndex<T>(
  storeName: string,
  indexName: string,
  key: IDBValidKey,
): Promise<T[]> {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, key);
}

// ─── Profile helpers ─────────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | undefined> {
  return getByKey<Profile>('profile', 'main');
}

export async function saveProfile(profile: Profile): Promise<void> {
  return putItem('profile', profile, 'main');
}

// ─── Focus timer state ──────────────────────────────────────────────────────
import type { FocusTimerState } from '../types';

export async function getFocusTimerState(): Promise<FocusTimerState | undefined> {
  return getByKey<FocusTimerState>('focusTimerState', 'current');
}

export async function saveFocusTimerState(state: FocusTimerState): Promise<void> {
  return putItem('focusTimerState', state, 'current');
}

export async function clearFocusTimerState(): Promise<void> {
  return deleteItem('focusTimerState', 'current');
}

// ─── Notes PIN ───────────────────────────────────────────────────────────────

export async function getNotesPinConfig(): Promise<NotesPinConfig | undefined> {
  return getByKey<NotesPinConfig>('notesPinConfig', 'config');
}

export async function saveNotesPinConfig(config: NotesPinConfig): Promise<void> {
  return putItem('notesPinConfig', config, 'config');
}

// ─── Gym split ───────────────────────────────────────────────────────────────

export async function getGymSplit(): Promise<GymSplit | undefined> {
  return getByKey<GymSplit>('gymSplit', 'current');
}

export async function saveGymSplit(split: GymSplit): Promise<void> {
  return putItem('gymSplit', split, 'current');
}

// ─── Export / Import ─────────────────────────────────────────────────────────

const ALL_STORES = [
  'profile',
  'tasks',
  'taskCompletions',
  'goals',
  'goalLogs',
  'focusSessions',
  'notes',
  'journalEntries',
  'gymSessions',
  'bodyWeightLogs',
  'subjects',
  'studySessions',
  'rewards',
  'redemptions',
  'dayRecords',
  'weeklyReviews',
  'earnedBadges',
  'favoriteQuotes',
  'focusTimerState',
  'notesPinConfig',
  'gymSplit',
] as const;

export async function exportAllData(): Promise<Record<string, unknown[]>> {
  const db = await getDB();
  const data: Record<string, unknown[]> = {};

  for (const store of ALL_STORES) {
    try {
      data[store] = await db.getAll(store);
    } catch {
      data[store] = [];
    }
  }

  return data;
}

export async function importAllData(data: Record<string, unknown[]>): Promise<void> {
  const db = await getDB();

  for (const store of ALL_STORES) {
    if (!data[store]) continue;
    const tx = db.transaction(store, 'readwrite');
    await tx.objectStore(store).clear();

    for (const item of data[store]) {
      // For stores with out-of-line keys (profile, focusTimerState, notesPinConfig, gymSplit)
      if (store === 'profile') {
        await tx.objectStore(store).put(item, 'main');
      } else if (store === 'focusTimerState') {
        await tx.objectStore(store).put(item, 'current');
      } else if (store === 'notesPinConfig') {
        await tx.objectStore(store).put(item, 'config');
      } else if (store === 'gymSplit') {
        await tx.objectStore(store).put(item, 'current');
      } else {
        await tx.objectStore(store).put(item);
      }
    }

    await tx.done;
  }
}

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  for (const store of ALL_STORES) {
    const tx = db.transaction(store, 'readwrite');
    await tx.objectStore(store).clear();
    await tx.done;
  }
}

// ─── Schema migration ───────────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 1;

export async function migrateIfNeeded(profile: Profile): Promise<Profile> {
  let p = { ...profile };

  // Future migrations go here:
  // if (p.schemaVersion < 2) { ... p.schemaVersion = 2; }

  return p;
}
