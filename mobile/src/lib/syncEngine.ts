import { supabase } from './supabase';
import { localDb } from './storage';
import {
  Task,
  Goal,
  Note,
  JournalEntry,
  GymSession,
  BodyWeightLog,
  StudySubject,
  Reward,
  Profile,
} from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedAt?: string;
}

export async function syncWithSupabase(): Promise<SyncResult> {
  try {
    // 1. Sync tasks
    const localTasks = await localDb.getTasks();
    if (localTasks.length > 0) {
      const formattedTasks = localTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: t.category,
        priority: t.priority,
        start_date: t.startDate,
        start_time: t.startTime || '',
        duration_min: t.durationMin || 30,
        repeat_type: t.repeatType,
        repeat_days: t.repeatDays || [],
        reminder: t.reminder || 'none',
        xp: t.xp,
        archived: t.archived,
      }));

      const { error: taskErr } = await supabase
        .from('tasks')
        .upsert(formattedTasks, { onConflict: 'id' });

      if (taskErr) {
        if (taskErr.code === 'PGRST205' || taskErr.message?.includes('not find the table')) {
          return {
            success: false,
            message: 'Database tables not found in Supabase. Please run supabase/schema.sql in your Supabase SQL editor.',
          };
        }
        console.warn('Supabase task sync notice:', taskErr.message);
      }
    }

    // 2. Sync goals
    const localGoals = await localDb.getGoals();
    if (localGoals.length > 0) {
      const formattedGoals = localGoals.map(g => ({
        id: g.id,
        title: g.title,
        type: g.type,
        target: g.target,
        step: g.step,
        unit: g.unit || '',
        icon: g.icon || 'target',
        archived: g.archived,
      }));
      await supabase.from('goals').upsert(formattedGoals, { onConflict: 'id' });
    }

    // 3. Sync notes
    const localNotes = await localDb.getNotes();
    if (localNotes.length > 0) {
      const formattedNotes = localNotes.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        checklist: n.checklist || [],
        tags: n.tags || [],
        color: n.color || '#1a2644',
        pinned: n.pinned,
      }));
      await supabase.from('notes').upsert(formattedNotes, { onConflict: 'id' });
    }

    // 4. Sync profile
    const profile = await localDb.getProfile();
    await supabase.from('profiles').upsert([
      {
        start_date: profile.startDate,
        arc_length: profile.arcLength,
        rollover_hour: profile.rolloverHour,
        total_xp: profile.totalXp,
        spendable_xp: profile.spendableXp,
        streak: profile.streak,
        best_streak: profile.bestStreak,
        freezes_left: profile.freezesLeft,
        theme: profile.theme,
        sound_enabled: profile.soundEnabled,
        notifications_enabled: profile.notificationsEnabled,
      }
    ]);

    return {
      success: true,
      message: 'Successfully synchronized with Supabase cloud database!',
      syncedAt: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Sync failed. Offline mode active.',
    };
  }
}
