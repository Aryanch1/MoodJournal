import { useWindowDimensions } from 'react-native';

/**
 * MoodJournal design tokens — one consistent system for the whole app.
 *
 * Identity: a "dusk journal". Dusk plum (#5E3A7A) is the one
 * disciplined theme color, with a warm peach (#F2A07B) and soft rose
 * (#E0787A) accent, on a pale lavender-white ground (#F7F4FA).
 * Lora (gentle serif, 700) is the display face — deliberately
 * different from Sora (FridgeToMeal/MediGuide), Fraunces
 * (SplitEase), Bricolage Grotesque (PlantDoctor), Archivo
 * (CivicHelper), Space Grotesk (BudgetBuddy), DM Serif Display
 * (ElderEase) and Bebas Neue (BloodBond). The home is a quiet river
 * of dated entries under a large mood-orb hero; navigation is top
 * segmented tabs (Today | Week | Entries), with a clean side rail on
 * wide screens. No photo hero, no floating pill tab bar, no ledger,
 * no dashboard grid, no budget ring, no big-button dock, no
 * board-switcher chips, no poster type, no day-timeline.
 */

export const palette = {
  // Brand — one disciplined dusk plum.
  primary: '#5E3A7A',
  primaryDeep: '#3E2453',
  primaryLight: '#7E5A9E',
  primarySoft: '#EDE5F5',
  primaryPale: '#F7F4FA',
  // Warm accents — peach and soft rose, used sparingly.
  peach: '#F2A07B',
  peachSoft: '#FDEBDF',
  rose: '#E0787A',
  roseSoft: '#FBE7E6',
  // Ground — pale lavender-white.
  ground: '#F7F4FA',
  // Neutrals (lavender tinted so the whole UI feels one family).
  ink: '#2E2438',
  body: '#5B5266',
  muted: '#8E8698',
  line: 'rgba(46, 36, 56, 0.10)',
  surface: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.62)',
  glassStrong: 'rgba(255, 255, 255, 0.82)',
  sheet: 'rgba(255, 255, 255, 0.88)',
  // Aurora background stops — lavender dusk.
  aurora: ['#F7F4FA', '#EFE7F6', '#FBE9E2'] as const,
  // Status.
  warning: '#A66A1F',
  warningSoft: '#FBF3DC',
  error: '#B3261E',
  errorSoft: '#FCE8E6',
  success: '#3E7D5B',
  successSoft: '#E6F2EA',
} as const;

/** Mood colors — one per point on the 5-point scale. */
export const moodColors: Record<number, string> = {
  1: '#7C86A6',
  2: '#9B7FB8',
  3: '#C99B6B',
  4: '#E0787A',
  5: '#F2A07B',
};

/** Backwards-compatible alias used by shared UI components. */
export const memberColors = [
  '#5E3A7A',
  '#E0787A',
  '#F2A07B',
  '#7E5A9E',
  '#3E7D5B',
  '#C99B6B',
  '#5B5266',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 18,
  card: 30,
  sheet: 38,
  pill: 999,
  input: 24,
} as const;

/**
 * Display typeface — Lora (bundled via @expo-google-fonts/lora,
 * loaded in app/_layout.tsx). Used for headlines, screen titles and
 * big numbers; body text stays on the system font.
 */
export const font = {
  display: 'Lora_700Bold',
  bold: 'Lora_700Bold',
} as const;

export const type = {
  display: { fontFamily: font.display, fontSize: 40, lineHeight: 46, letterSpacing: -0.3 },
  displayWide: { fontFamily: font.display, fontSize: 52, lineHeight: 56, letterSpacing: -0.3 },
  title: { fontFamily: font.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.2 },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.6 },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '700' as const, letterSpacing: 1.1 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#2E2438',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: {
    shadowColor: '#5E3A7A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  float: {
    shadowColor: '#2E2438',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

export type Breakpoint = 'compact' | 'medium' | 'wide' | 'desktop';

export interface Responsive {
  breakpoint: Breakpoint;
  width: number;
  /** Max width for the centered content column. */
  contentMaxWidth: number;
  /** Horizontal page padding. */
  pad: number;
  /** Columns for card grids. */
  columns: number;
  /** Two-pane list + detail layout (foldable unfolded / tablet / desktop). */
  twoPane: boolean;
  display: typeof type.display | typeof type.displayWide;
}

export function useResponsive(): Responsive {
  const { width } = useWindowDimensions();
  if (width < 600) {
    return {
      breakpoint: 'compact',
      width,
      contentMaxWidth: width,
      pad: 20,
      columns: 1,
      twoPane: false,
      display: type.display,
    };
  }
  if (width < 840) {
    return {
      breakpoint: 'medium',
      width,
      contentMaxWidth: 640,
      pad: 28,
      columns: 1,
      twoPane: false,
      display: type.displayWide,
    };
  }
  if (width < 1280) {
    return {
      breakpoint: 'wide',
      width,
      contentMaxWidth: 1024,
      pad: 32,
      columns: 2,
      twoPane: true,
      display: type.displayWide,
    };
  }
  return {
    breakpoint: 'desktop',
    width,
    contentMaxWidth: 1120,
    pad: 40,
    columns: 3,
    twoPane: true,
    display: type.displayWide,
  };
}
