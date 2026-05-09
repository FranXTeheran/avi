export const lightColors = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSoft: "#FAFAFA",

  primary: "#FFC21A",
  primarySoft: "#FFF4D2",

  text: "#1F1F1F",
  muted: "#7A7A7A",
  subtle: "#B0B0B0",
  border: "#EFEFEF",

  success: "#22C55E",
  successSoft: "#EAF9EF",

  danger: "#EF4444",
  dangerSoft: "#FFECEC",
} as const;

export const darkColors = {
  background: "#11120F",
  surface: "#1A1B17",
  surfaceSoft: "#23241F",

  primary: "#FFC21A",
  primarySoft: "#3A3215",

  text: "#F7F3E8",
  muted: "#B8B2A4",
  subtle: "#7D766A",
  border: "#2D2D27",

  success: "#4ADE80",
  successSoft: "#14351F",

  danger: "#FB7185",
  dangerSoft: "#3A171D",
} as const;

export const colors = lightColors;

export type AppColors = typeof lightColors | typeof darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 28,
  xl: 34,
  full: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },

  soft: {
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 1,
  },
} as const;