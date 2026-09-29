import { nanoid } from 'nanoid';
import type { Task, Goal, Note } from '../types';
import { formatDate, addDays } from '../utils/dates';

export function createSampleData() {
  const today = new Date();
  const todayStr = formatDate(today);

  const sampleTasks: Task[] = [
    {
      id: nanoid(),
      title: 'Morning Workout',
      description: 'Push day – chest, shoulders, triceps [sample]',
      category: 'Gym',
      priority: 'high',
      startDate: todayStr,
      startTime: '06:00',
      durationMin: 60,
      repeat: { type: 'weekdays', days: [] },
      reminder: 'at_time',
      xp: 30,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Study DSA',
      description: 'LeetCode practice – medium problems [sample]',
      category: 'Study',
      priority: 'high',
      startDate: todayStr,
      startTime: '09:00',
      durationMin: 90,
      repeat: { type: 'daily', days: [] },
      reminder: '10_min_before',
      xp: 30,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Read 30 minutes',
      description: 'Continue current book [sample]',
      category: 'Personal',
      priority: 'medium',
      startDate: todayStr,
      startTime: '21:00',
      durationMin: 30,
      repeat: { type: 'daily', days: [] },
      reminder: 'none',
      xp: 20,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Meal Prep',
      description: 'Prepare healthy meals for the week [sample]',
      category: 'Health',
      priority: 'medium',
      startDate: formatDate(addDays(today, 1)),
      startTime: '11:00',
      durationMin: 45,
      repeat: { type: 'weekly', days: [0] },
      reminder: 'none',
      xp: 20,
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Project Work',
      description: 'Work on side project [sample]',
      category: 'Work',
      priority: 'medium',
      startDate: todayStr,
      startTime: '14:00',
      durationMin: 120,
      repeat: { type: 'weekdays', days: [] },
      reminder: 'at_time',
      xp: 20,
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const sampleGoals: Goal[] = [
    {
      id: nanoid(),
      title: 'Water',
      type: 'counter',
      target: 8,
      step: 1,
      unit: 'glasses',
      icon: '💧',
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'No Junk Food',
      type: 'checkbox',
      target: 1,
      step: 1,
      unit: '',
      icon: '🥗',
      archived: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(),
      title: 'Meditation',
      type: 'counter',
      target: 10,
      step: 5,
      unit: 'min',
      icon: '🧘',
      archived: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const sampleNotes: Note[] = [
    {
      id: nanoid(),
      title: 'Welcome to Winter Arc! ❄️',
      body: 'This is your personal discipline tracker for the next 90 days. You can create tasks, set daily goals, track your workouts, study sessions, and more.\n\nTip: This is sample data – you can clear it from Settings.',
      checklist: [
        { id: nanoid(), text: 'Set up daily goals', checked: false },
        { id: nanoid(), text: 'Create your first task', checked: false },
        { id: nanoid(), text: 'Try the focus timer', checked: false },
      ],
      tags: ['sample', 'welcome'],
      color: '#1e3a5f',
      pinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return { sampleTasks, sampleGoals, sampleNotes };
}
