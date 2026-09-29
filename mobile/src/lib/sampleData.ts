import { Task, Goal, Note, StudySubject, Reward, GymSession, BodyWeightLog } from '../types';

export function getSampleData() {
  const today = new Date().toISOString().split('T')[0];

  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Heavy Compound Lift: Push Day',
      description: 'Bench press 4x8, Overhead press 3x10, Tricep pushdowns',
      category: 'Gym',
      priority: 'high',
      startDate: today,
      startTime: '06:30',
      durationMin: 60,
      repeatType: 'daily',
      repeatDays: [1, 3, 5],
      reminder: '10_min_before',
      xp: 30,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-2',
      title: 'Deep Focus Coding / Study',
      description: 'No social media, no distractions, work on core project',
      category: 'Study',
      priority: 'high',
      startDate: today,
      startTime: '09:00',
      durationMin: 90,
      repeatType: 'weekdays',
      repeatDays: [1, 2, 3, 4, 5],
      reminder: 'at_time',
      xp: 40,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-3',
      title: 'Hydration Target: 3.5 Litres',
      description: 'Track water intake across morning, workout, and evening',
      category: 'Health',
      priority: 'medium',
      startDate: today,
      startTime: '08:00',
      durationMin: 10,
      repeatType: 'daily',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      reminder: 'none',
      xp: 15,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'task-4',
      title: '15 Minutes Cold Morning Walk',
      description: 'Sunlight in eyes within 30 min of waking up',
      category: 'Personal',
      priority: 'low',
      startDate: today,
      startTime: '06:00',
      durationMin: 15,
      repeatType: 'daily',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      reminder: 'none',
      xp: 20,
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Complete 90 Workouts in Arc',
      type: 'counter',
      target: 90,
      step: 1,
      unit: 'workouts',
      icon: 'dumbbell',
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'goal-2',
      title: 'Read 6 Non-Fiction Books',
      type: 'counter',
      target: 6,
      step: 1,
      unit: 'books',
      icon: 'book',
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'goal-3',
      title: 'Zero Sugar & Clean Eating Days',
      type: 'counter',
      target: 80,
      step: 1,
      unit: 'days',
      icon: 'apple',
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const notes: Note[] = [
    {
      id: 'note-1',
      title: 'The Winter Arc Non-Negotiables',
      body: '1. Wake up at 5:30 AM without hitting snooze.\n2. 1 hour minimum high-focus study or development.\n3. Daily physical training (lift or cardio).\n4. Track everything in WinterArc.',
      checklist: [
        { id: 'c1', text: 'Wake up at 5:30 AM', checked: true },
        { id: 'c2', text: 'No scrolling before noon', checked: true },
        { id: 'c3', text: '100 Pushups daily baseline', checked: false },
      ],
      tags: ['Mindset', 'Rules'],
      color: '#1a2644',
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const studySubjects: StudySubject[] = [
    { id: 'sub-1', name: 'Software Architecture', weeklyTargetMin: 360, archived: false },
    { id: 'sub-2', name: 'Machine Learning Fundamentals', weeklyTargetMin: 240, archived: false },
  ];

  const rewards: Reward[] = [
    { id: 'rew-1', title: '🎮 1 Hour Video Game Session', cost: 100, archived: false },
    { id: 'rew-2', title: '🎬 Full Movie Night with Popcorn', cost: 150, archived: false },
    { id: 'rew-3', title: '🍿 2 Episodes of TV Series', cost: 120, archived: false },
    { id: 'rew-4', title: '🍕 Cheat Meal of Choice', cost: 250, archived: false },
    { id: 'rew-5', title: '☕ Specialty Coffee / Boba Break', cost: 80, archived: false },
    { id: 'rew-6', title: '😴 Sleep In 1 Extra Hour', cost: 200, archived: false },
    { id: 'rew-7', title: '👕 New Workout Gear / Apparel', cost: 500, archived: false },
  ];

  const weightLogs: BodyWeightLog[] = [
    { date: today, kg: 76.5 },
  ];

  const gymSessions: GymSession[] = [
    {
      id: 'gym-1',
      date: today,
      exercises: [
        {
          name: 'Flat Barbell Bench Press',
          sets: [
            { reps: 10, weight: 60 },
            { reps: 8, weight: 70 },
            { reps: 6, weight: 75 },
          ],
        },
        {
          name: 'Incline Dumbbell Press',
          sets: [
            { reps: 10, weight: 24 },
            { reps: 10, weight: 26 },
          ],
        },
      ],
    },
  ];

  return { tasks, goals, notes, studySubjects, rewards, weightLogs, gymSessions };
}
