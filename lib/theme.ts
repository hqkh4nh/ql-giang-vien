import { useWindowDimensions } from 'react-native';
import { MD3LightTheme, type MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 2,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2155C4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3EAFA',
    onPrimaryContainer: '#0F2A66',
    secondaryContainer: '#E3EAFA',
    onSecondaryContainer: '#0F2A66',
    background: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F5',
    onSurface: '#1A1D23',
    onSurfaceVariant: '#5B6270',
    outline: '#C9CED6',
    outlineVariant: '#E3E6EB',
    error: '#C62828',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
    },
  },
};

export const CONTENT_MAX_WIDTH = 960;
export const RADIUS = 12;

// From 720px up (landscape tablets, laptops) screens switch to multi-column layouts.
export function useIsWide() {
  return useWindowDimensions().width >= 720;
}

// Light background + dark text of the same hue for initials avatars, picked from the ID so each lecturer keeps a stable color.
const AVATAR_TONES = [
  { bg: '#E3EAFA', fg: '#1E3A8A' },
  { bg: '#DDF3E6', fg: '#14532D' },
  { bg: '#FDEFD3', fg: '#7A4B00' },
  { bg: '#FBE3E8', fg: '#881337' },
  { bg: '#ECE6FB', fg: '#4C1D95' },
  { bg: '#DDF1F1', fg: '#134E4A' },
];

export function avatarTone(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
