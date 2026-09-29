// WinterArc Mobile Design Tokens & Palette
// Aligned with decisions.md - icy discipline background with warm, rewarding mint & ice blue accents

export const colors = {
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
    shadowOpacity: 0.35,
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
