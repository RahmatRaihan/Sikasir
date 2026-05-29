// Theme & Design Tokens — SiKasir RS Rubini
// Based on PRD Section 8: Desain & UI Guidelines

import { MD3LightTheme } from 'react-native-paper';

// ─── Color Palette ───────────────────────────────────────────────
export const Colors = {
  primary: '#1565C0',       // Biru Tua RS — Navbar, tombol utama
  primaryLight: '#1E88E5',
  primaryDark: '#0D47A1',
  secondary: '#2E7D32',     // Hijau Sehat — Tombol selesaikan, konfirmasi
  secondaryLight: '#43A047',
  secondaryDark: '#1B5E20',
  accent: '#F57C00',        // Oranye Hangat — Badge, highlight promo
  accentLight: '#FFB74D',
  danger: '#C62828',        // Merah — Delete, stok kritis
  dangerLight: '#EF5350',
  warning: '#F9A825',
  success: '#2E7D32',
  surface: '#FAFAFA',       // Putih Bersih — Background card
  background: '#F0F2F5',    // Abu Sangat Muda — Background layar
  textPrimary: '#212121',   // Abu Gelap — Body text utama
  textSecondary: '#757575', // Abu Medium — Label, hint
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',
  white: '#FFFFFF',
  black: '#000000',

  // Penyedia-specific colors
  dwp: '#1565C0',
  mona: '#AD1457',
  harian: '#F57C00',
  kering: '#2E7D32',
} as const;

// ─── Typography ──────────────────────────────────────────────────
export const Typography = {
  h1: {
    fontFamily: 'Roboto',
    fontSize: 24,
    fontWeight: '700' as const,   // Bold
    lineHeight: 32,
  },
  h2: {
    fontFamily: 'Roboto',
    fontSize: 20,
    fontWeight: '600' as const,   // SemiBold
    lineHeight: 28,
  },
  h3: {
    fontFamily: 'Roboto',
    fontSize: 18,
    fontWeight: '500' as const,   // Medium
    lineHeight: 24,
  },
  body: {
    fontFamily: 'Roboto',
    fontSize: 14,
    fontWeight: '400' as const,   // Regular
    lineHeight: 20,
  },
  caption: {
    fontFamily: 'Roboto',
    fontSize: 12,
    fontWeight: '400' as const,   // Regular
    lineHeight: 16,
  },
  price: {
    fontFamily: 'RobotoMono',
    fontSize: 18,
    fontWeight: '700' as const,   // Bold
    lineHeight: 24,
  },
  priceSmall: {
    fontFamily: 'RobotoMono',
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// ─── React Native Paper MD3 Custom Theme ─────────────────────────
export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    onPrimary: Colors.white,
    primaryContainer: '#BBDEFB',
    onPrimaryContainer: Colors.primaryDark,
    secondary: Colors.secondary,
    onSecondary: Colors.white,
    secondaryContainer: '#C8E6C9',
    onSecondaryContainer: Colors.secondaryDark,
    tertiary: Colors.accent,
    onTertiary: Colors.white,
    error: Colors.danger,
    onError: Colors.white,
    background: Colors.background,
    onBackground: Colors.textPrimary,
    surface: Colors.surface,
    onSurface: Colors.textPrimary,
    surfaceVariant: '#E8EAF0',
    onSurfaceVariant: Colors.textSecondary,
    outline: Colors.border,
    elevation: {
      level0: 'transparent',
      level1: Colors.white,
      level2: Colors.surface,
      level3: '#F5F5F5',
      level4: '#EEEEEE',
      level5: '#E0E0E0',
    },
  },
  roundness: BorderRadius.md,
};

// ─── Layout Constants (Tablet 8.8") ──────────────────────────────
export const Layout = {
  kasirLeftRatio: 0.6,   // 60% produk panel
  kasirRightRatio: 0.4,  // 40% payment panel
  gridColumns: 12,
  gridMargin: 16,
  gridGutter: 12,
  tabBarHeight: 64,
} as const;
