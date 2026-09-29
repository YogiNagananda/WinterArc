export interface Level {
  name: string;
  minXp: number;
  icon: string;
  title: string;
}

export const LEVELS: Level[] = [
  { name: 'Rookie', minXp: 0, icon: '🌱', title: 'The Unforged' },
  { name: 'Grinder', minXp: 300, icon: '⚡', title: 'Daily Executioner' },
  { name: 'Disciplined', minXp: 800, icon: '🛡️', title: 'Iron Mind' },
  { name: 'Beast', minXp: 1800, icon: '🐺', title: 'Relentless Force' },
  { name: 'Legend', minXp: 3500, icon: '🏆', title: 'Winter Arc Master' },
];

/**
 * Get current level based on total XP points.
 */
export function getLevel(totalXp: number): Level {
  const xp = Math.max(0, totalXp || 0);
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

/**
 * Get next level or null if reached max level (Legend).
 */
export function getNextLevel(totalXp: number): Level | null {
  const current = getLevel(totalXp);
  const idx = LEVELS.findIndex(l => l.name === current.name);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

/**
 * Get percentage progress to the next level (0 - 100).
 */
export function getLevelProgress(totalXp: number): number {
  const xp = Math.max(0, totalXp || 0);
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  if (range <= 0) return 100;
  const progress = xp - current.minXp;
  return Math.min(100, Math.max(0, Math.round((progress / range) * 100)));
}

/**
 * Get XP remaining until next level.
 */
export function getXpToNextLevel(totalXp: number): number {
  const xp = Math.max(0, totalXp || 0);
  const next = getNextLevel(xp);
  if (!next) return 0;
  return Math.max(0, next.minXp - xp);
}
