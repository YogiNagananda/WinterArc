import type { Goal } from '../types';
import { nanoid } from 'nanoid';

export const goalPresets: Omit<Goal, 'id' | 'createdAt' | 'archived'>[] = [
  { title: 'Water', type: 'counter', target: 8, step: 1, unit: 'glasses', icon: '💧' },
  { title: 'Study Hours', type: 'time', target: 120, step: 1, unit: 'min', icon: '📚' },
  { title: 'Steps', type: 'counter', target: 10000, step: 1000, unit: 'steps', icon: '🚶' },
  { title: 'Gym Session', type: 'checkbox', target: 1, step: 1, unit: '', icon: '🏋️' },
  { title: 'Sleep Before 11 PM', type: 'checkbox', target: 1, step: 1, unit: '', icon: '🌙' },
  { title: 'Reading', type: 'counter', target: 30, step: 5, unit: 'min', icon: '📖' },
  { title: 'No Junk Food', type: 'checkbox', target: 1, step: 1, unit: '', icon: '🥗' },
  { title: 'Meditation', type: 'counter', target: 10, step: 5, unit: 'min', icon: '🧘' },
];

export function createGoalFromPreset(preset: typeof goalPresets[number]): Goal {
  return {
    ...preset,
    id: nanoid(),
    archived: false,
    createdAt: new Date().toISOString(),
  };
}
