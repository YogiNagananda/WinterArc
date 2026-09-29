// WinterArc Mobile Design Tokens & Palette
// Supports Dark (Icy Navy) and Light (Icy Frost) themes
import { useWinterStore } from '../store/useWinterStore';

export const darkColors = {
  bgPrimary: '#0f1729',      // Deep navy
  bgSecondary: '#141d33',    // Secondary background
  cardBg: '#1a2644',         // Card surface
  cardElevated: '#223259',   // Elevated card / modal
  border: '#243252',         // Subtle border
  borderActive: '#324775',   // Hover / active border

  // Semantic Accents
  iceBlue: '#00d9ff',        // Primary hero accent
  iceBlueSubtle: 'rgba(0, 217, 255, 0.15)',
  iceBlueHover: '#33e1ff',

  mintSuccess: '#00d97f',    // Completion / streak reward
  mintSubtle: 'rgba(0, 217, 127, 0.15)',

  amberWarning: '#ffaa00',   // Warnings / freeze alerts
  amberSubtle: 'rgba(255, 170, 0, 0.15)',

  dangerCoral: '#ff6b6b',    // Destructive actions
  dangerSubtle: 'rgba(255, 107, 107, 0.15)',

  // Typography
  textPrimary: '#ffffff',
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',
  textOnIce: '#0a101d',      // Contrast text for solid ice blue buttons

  // Categories
  categoryGym: '#f43f5e',
  categoryStudy: '#8b5cf6',
  categoryHealth: '#10b981',
  categoryWork: '#3b82f6',
  categoryPersonal: '#ec4899',
};

export const lightColors = {
  bgPrimary: '#f0f4f8',      // Crisp light icy frost
  bgSecondary: '#e2e8f0',    // Slate light background
  cardBg: '#ffffff',         // Clean white card surface
  cardElevated: '#f8fafc',   // Elevated card surface
  border: '#cbd5e1',         // Crisp border
  borderActive: '#94a3b8',   // Active border

  // Semantic Accents
  iceBlue: '#0284c7',        // Crisp sky/cyan blue (high contrast on light)
  iceBlueSubtle: 'rgba(2, 132, 199, 0.12)',
  iceBlueHover: '#0369a1',

  mintSuccess: '#059669',    // Emerald/mint
  mintSubtle: 'rgba(5, 150, 105, 0.12)',

  amberWarning: '#d97706',   // Crisp amber
  amberSubtle: 'rgba(217, 119, 6, 0.12)',

  dangerCoral: '#e11d48',    // Crisp rose/coral
  dangerSubtle: 'rgba(225, 29, 72, 0.12)',

  // Typography
  textPrimary: '#0f172a',    // High-contrast slate 900
  textSecondary: '#334155',  // Slate 700
  textMuted: '#64748b',      // Slate 500
  textOnIce: '#ffffff',      // White text on dark sky blue

  // Categories
  categoryGym: '#e11d48',
  categoryStudy: '#7c3aed',
  categoryHealth: '#059669',
  categoryWork: '#2563eb',
  categoryPersonal: '#db2777',
};

export type AppColors = typeof darkColors;

// Default colors instance for static references
export const colors: AppColors = darkColors;

export function getThemeColors(theme?: 'dark' | 'light'): AppColors {
  return theme === 'light' ? lightColors : darkColors;
}

export function useTheme() {
  const theme = useWinterStore(s => s.profile.theme);
  const isDark = theme !== 'light';
  const activeColors = isDark ? darkColors : lightColors;

  return {
    theme: (theme || 'dark') as 'dark' | 'light',
    isDark,
    colors: activeColors,
    spacing,
    borderRadius,
    shadow,
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  glowIce: {
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  glowMint: {
    shadowColor: '#00d97f',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
};
