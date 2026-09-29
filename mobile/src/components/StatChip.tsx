import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/colors';

interface StatChipProps {
  label: string;
  value: string | number;
  icon?: string;
  color?: 'ice' | 'mint' | 'amber' | 'neutral';
}

export const StatChip: React.FC<StatChipProps> = ({
  label,
  value,
  icon,
  color = 'ice',
}) => {
  const { colors, borderRadius, spacing } = useTheme();

  const getColors = () => {
    switch (color) {
      case 'mint':
        return {
          bg: colors.mintSubtle,
          border: colors.mintSuccess,
          text: colors.mintSuccess,
        };
      case 'amber':
        return {
          bg: colors.amberSubtle,
          border: colors.amberWarning,
          text: colors.amberWarning,
        };
      case 'neutral':
        return {
          bg: colors.border,
          border: colors.borderActive,
          text: colors.textSecondary,
        };
      default:
        return {
          bg: colors.iceBlueSubtle,
          border: colors.iceBlue,
          text: colors.iceBlue,
        };
    }
  };

  const c = getColors();
  const styles = useMemo(() => createStyles(colors, borderRadius, spacing), [colors, borderRadius, spacing]);

  return (
    <View style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.value, { color: c.text }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

const createStyles = (colors: any, borderRadius: any, spacing: any) =>
  StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      marginRight: spacing.sm,
    },
    icon: {
      fontSize: 14,
      marginRight: 6,
    },
    textContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    value: {
      fontWeight: '800',
      fontSize: 13,
      marginRight: 4,
    },
    label: {
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
  });
