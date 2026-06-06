export const lightColors = {
	background: "#F8FBFF",
	surface: "#FFFFFF",
	surfaceSoft: "#EEF6FF",

	primary: "#3498F3",
	primarySoft: "#DCEEFF",

	text: "#15202B",
	muted: "#64748B",
	subtle: "#94A3B8",
	border: "#E2EAF3",

	success: "#22C55E",
	successSoft: "#DCFCE7",

	danger: "#EF4444",
	dangerSoft: "#FEE2E2",
} as const;

export const darkColors = {
	background: "#0D141C",
	surface: "#152331",
	surfaceSoft: "#1B2D3D",

	primary: "#3498F3",
	primarySoft: "#1D3B57",

	text: "#F5F9FF",
	muted: "#A7B8CB",
	subtle: "#6D8093",
	border: "#24384A",

	success: "#4ADE80",
	successSoft: "#14351F",

	danger: "#FB7185",
	dangerSoft: "#3A171D",
} as const;

export const colors = lightColors;

export type AppColors =
	| typeof lightColors
	| typeof darkColors;

export const kaiColors = {
	blue: "#3498F3",
	blueDark: "#287DCC",
	blueSoft: "#DCEEFF",

	petroleum: "#1F4E79",
	petroleumDark: "#163A59",

	ink: "#15202B",
	white: "#F5F9FF",
} as const;

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