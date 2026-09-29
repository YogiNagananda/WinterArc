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
  TaskCompletion,
  GoalLog,
  StudySession,
  Redemption,
  DayRecord,
  FocusSession,
} from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedAt?: string;
  counts?: {
    tasks: number;
    goals: number;
    notes: number;
    sessions: number;
  };
}

/**
 * Sync ALL data from local storage up to Supabase database.
 * If local storage has 0 tasks/goals but Supabase has them, pulls down from Supabase.
 */
export async function syncWithSupabase(): Promise<SyncResult> {
  try {
    // 1. Profile
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
      },
    ]);

    // 2. Tasks
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
      await supabase.from('tasks').upsert(formattedTasks, { onConflict: 'id' });
    }

    // 3. Task Completions
    const localCompletions = await localDb.getCompletions();
    if (localCompletions.length > 0) {
      const formattedCompletions = localCompletions.map(c => ({
        task_id: c.taskId,
        date: c.date,
        completed_at: c.completedAt || new Date().toISOString(),
        actual_minutes: c.actualMinutes || 30,
      }));
      await supabase.from('task_completions').upsert(formattedCompletions, { onConflict: 'task_id,date' });
    }

    // 4. Goals
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

    // 5. Goal Logs
    const localGoalLogs = await localDb.getGoalLogs();
    if (localGoalLogs.length > 0) {
      const formattedLogs = localGoalLogs.map(l => ({
        goal_id: l.goalId,
        date: l.date,
        value: l.value,
      }));
      await supabase.from('goal_logs').upsert(formattedLogs, { onConflict: 'goal_id,date' });
    }

    // 6. Notes
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

    // 7. Journal
    const localJournal = await localDb.getJournal();
    if (localJournal.length > 0) {
      const formattedJournal = localJournal.map(j => ({
        date: j.date,
        text: j.text,
        mood: j.mood,
      }));
      await supabase.from('journal_entries').upsert(formattedJournal, { onConflict: 'date' });
    }

    // 8. Gym Sessions
    const localGym = await localDb.getGymSessions();
    if (localGym.length > 0) {
      const formattedGym = localGym.map(s => ({
        id: s.id,
        date: s.date,
        exercises: s.exercises || [],
      }));
      await supabase.from('gym_sessions').upsert(formattedGym, { onConflict: 'id' });
    }

    // 9. Weight Logs
    const localWeights = await localDb.getWeightLogs();
    if (localWeights.length > 0) {
      const formattedWeights = localWeights.map(w => ({
        date: w.date,
        kg: w.kg,
      }));
      await supabase.from('body_weight_logs').upsert(formattedWeights, { onConflict: 'date' });
    }

    // 10. Study Subjects
    const localSubjects = await localDb.getStudySubjects();
    if (localSubjects.length > 0) {
      const formattedSubjects = localSubjects.map(s => ({
        id: s.id,
        name: s.name,
        weekly_target_min: s.weeklyTargetMin,
        archived: s.archived,
      }));
      await supabase.from('study_subjects').upsert(formattedSubjects, { onConflict: 'id' });
    }

    // 11. Study Sessions
    const localSessions = await localDb.getStudySessions();
    if (localSessions.length > 0) {
      const formattedSessions = localSessions.map(s => ({
        id: s.id,
        subject_id: s.subjectId,
        date: s.date,
        minutes: s.minutes,
      }));
      await supabase.from('study_sessions').upsert(formattedSessions, { onConflict: 'id' });
    }

    // 12. Rewards
    const localRewards = await localDb.getRewards();
    if (localRewards.length > 0) {
      const formattedRewards = localRewards.map(r => ({
        id: r.id,
        title: r.title,
        cost: r.cost,
        archived: r.archived,
      }));
      await supabase.from('rewards').upsert(formattedRewards, { onConflict: 'id' });
    }

    // 13. Redemptions
    const localRedemptions = await localDb.getRedemptions();
    if (localRedemptions.length > 0) {
      const formattedRedemptions = localRedemptions.map(r => ({
        id: r.id,
        reward_id: r.rewardId,
        redeemed_at: r.redeemedAt,
      }));
      await supabase.from('redemptions').upsert(formattedRedemptions, { onConflict: 'id' });
    }

    // 14. Day Records
    const localDayRecords = await localDb.getDayRecords();
    if (localDayRecords.length > 0) {
      const formattedRecords = localDayRecords.map(d => ({
        date: d.date,
        successful: d.successful,
        xp_earned: d.xpEarned,
        freeze_used: d.freezeUsed,
      }));
      await supabase.from('day_records').upsert(formattedRecords, { onConflict: 'date' });
    }

    // 15. Focus Sessions
    const localFocus = await localDb.getFocusSessions();
    if (localFocus.length > 0) {
      const formattedFocus = localFocus.map(f => ({
        id: f.id,
        task_id: f.taskId || null,
        subject_id: f.subjectId || null,
        started_at: f.startedAt,
        minutes: f.minutes,
      }));
      await supabase.from('focus_sessions').upsert(formattedFocus, { onConflict: 'id' });
    }

    return {
      success: true,
      message: 'Synced locally and with Supabase Cloud!',
      syncedAt: new Date().toLocaleTimeString(),
      counts: {
        tasks: localTasks.length,
        goals: localGoals.length,
        notes: localNotes.length,
        sessions: localGym.length + localSessions.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Sync failed. Local storage preserved.',
    };
  }
}

/**
 * Delete a specific record from Supabase table
 */
export async function deleteFromSupabase(table: string, column: string, value: string): Promise<void> {
  try {
    await supabase.from(table).delete().eq(column, value);
  } catch (e) {
    console.warn(`Error deleting from Supabase ${table}:`, e);
  }
}

/**
 * Pull all data from Supabase and save into local storage
 */
export async function pullFromSupabase() {
  try {
    const { data: remoteTasks } = await supabase.from('tasks').select('*');
    if (remoteTasks && remoteTasks.length > 0) {
      const tasks: Task[] = remoteTasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        category: t.category,
        priority: t.priority,
        startDate: t.start_date,
        startTime: t.start_time || '',
        durationMin: t.duration_min || 30,
        repeatType: t.repeat_type,
        repeatDays: t.repeat_days || [],
        reminder: t.reminder || 'none',
        xp: t.xp,
        archived: t.archived,
        createdAt: t.created_at || new Date().toISOString(),
      }));
      await localDb.saveTasks(tasks);
    }

    const { data: remoteGoals } = await supabase.from('goals').select('*');
    if (remoteGoals && remoteGoals.length > 0) {
      const goals: Goal[] = remoteGoals.map(g => ({
        id: g.id,
        title: g.title,
        type: g.type,
        target: g.target,
        step: g.step,
        unit: g.unit || '',
        icon: g.icon || 'target',
        archived: g.archived,
        createdAt: g.created_at || new Date().toISOString(),
      }));
      await localDb.saveGoals(goals);
    }

    const { data: remoteNotes } = await supabase.from('notes').select('*');
    if (remoteNotes && remoteNotes.length > 0) {
      const notes: Note[] = remoteNotes.map(n => ({
        id: n.id,
        title: n.title,
        body: n.body,
        checklist: n.checklist || [],
        tags: n.tags || [],
        color: n.color || '#1a2644',
        pinned: n.pinned,
        createdAt: n.created_at || new Date().toISOString(),
        updatedAt: n.updated_at || new Date().toISOString(),
      }));
      await localDb.saveNotes(notes);
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, message: e?.message };
  }
}
