export type ThemeId = "obsidian_gold" | "cyber_aurora" | "emerald_royal" | "crimson_velvet";

export interface AppTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  bg: string;
  bgAlt: string;
  surface: string;
  surface2: string;
  glass: string;
  border: string;
  borderGlow: string;
  text: string;
  muted: string;
  primary: string;
  primarySoft: string;
  accent: string;
  btnText: string;
  auroraTop: [string, string, string];
  btnGrad: [string, string];
  storyGrad: [string, string, string];
  coverGrad: [string, string, string];
  cardHighlight: [string, string];
  dockBg: string;
  heart: string;
  verified: string;
  danger: string;
  success: string;
  warn: string;
}

export const THEMES: Record<ThemeId, AppTheme> = {
  obsidian_gold: {
    id: "obsidian_gold",
    name: "ذهب أوبسيديان الملكي",
    tagline: "فخامة سوداء بلمسة ذهب سائل حصرية لـ SHAHINAZ",
    emoji: "👑",
    bg: "#05060B",
    bgAlt: "#0A0D16",
    surface: "#0E111C",
    surface2: "#161B2B",
    glass: "rgba(18, 22, 36, 0.84)",
    border: "rgba(255, 255, 255, 0.08)",
    borderGlow: "rgba(245, 198, 92, 0.34)",
    text: "#FAF8F4",
    muted: "#8E96AD",
    primary: "#F5C65C",
    primarySoft: "rgba(245, 198, 92, 0.16)",
    accent: "#E88B38",
    btnText: "#090A0F",
    auroraTop: ["rgba(245, 198, 92, 0.20)", "rgba(232, 139, 56, 0.08)", "rgba(5, 6, 11, 0)"],
    btnGrad: ["#FDE68A", "#D97706"],
    storyGrad: ["#FDE68A", "#F59E0B", "#B45309"],
    coverGrad: ["#2D1F07", "#14101B", "#05060B"],
    cardHighlight: ["rgba(245, 198, 92, 0.18)", "rgba(14, 17, 28, 0.96)"],
    dockBg: "rgba(12, 15, 25, 0.96)",
    heart: "#FB375B",
    verified: "#38BDF8",
    danger: "#EF4444",
    success: "#10B981",
    warn: "#F5C65C",
  },
  cyber_aurora: {
    id: "cyber_aurora",
    name: "شفق سايبر الكوني",
    tagline: "إضاءة نيون سماوية وبنفسجية مستقبلية",
    emoji: "🌌",
    bg: "#040712",
    bgAlt: "#091024",
    surface: "#0D152B",
    surface2: "#15203E",
    glass: "rgba(15, 24, 48, 0.85)",
    border: "rgba(148, 163, 184, 0.12)",
    borderGlow: "rgba(56, 189, 248, 0.38)",
    text: "#F8FAFC",
    muted: "#94A3B8",
    primary: "#38BDF8",
    primarySoft: "rgba(56, 189, 248, 0.16)",
    accent: "#A855F7",
    btnText: "#FFFFFF",
    auroraTop: ["rgba(56, 189, 248, 0.22)", "rgba(168, 85, 247, 0.12)", "rgba(4, 7, 18, 0)"],
    btnGrad: ["#06B6D4", "#8B5CF6"],
    storyGrad: ["#22D3EE", "#818CF8", "#E879F9"],
    coverGrad: ["#0C2A45", "#1E123B", "#040712"],
    cardHighlight: ["rgba(56, 189, 248, 0.16)", "rgba(13, 21, 43, 0.96)"],
    dockBg: "rgba(11, 18, 36, 0.96)",
    heart: "#F43F5E",
    verified: "#38BDF8",
    danger: "#EF4444",
    success: "#10B981",
    warn: "#FBBF24",
  },
  emerald_royal: {
    id: "emerald_royal",
    name: "زمرد الصحراء الفاخر",
    tagline: "أخضر زمردي ملكي مع بريق ذهبي جزائري",
    emoji: "🌿",
    bg: "#030B09",
    bgAlt: "#071713",
    surface: "#0B1E19",
    surface2: "#122C25",
    glass: "rgba(11, 30, 25, 0.86)",
    border: "rgba(167, 243, 208, 0.10)",
    borderGlow: "rgba(16, 185, 129, 0.38)",
    text: "#F3FAF7",
    muted: "#84A99E",
    primary: "#10B981",
    primarySoft: "rgba(16, 185, 129, 0.16)",
    accent: "#FBBF24",
    btnText: "#02110C",
    auroraTop: ["rgba(16, 185, 129, 0.22)", "rgba(251, 191, 36, 0.08)", "rgba(3, 11, 9, 0)"],
    btnGrad: ["#34D399", "#059669"],
    storyGrad: ["#34D399", "#10B981", "#FBBF24"],
    coverGrad: ["#063628", "#0A201A", "#030B09"],
    cardHighlight: ["rgba(16, 185, 129, 0.18)", "rgba(11, 30, 25, 0.96)"],
    dockBg: "rgba(9, 24, 20, 0.96)",
    heart: "#FB375B",
    verified: "#34D399",
    danger: "#EF4444",
    success: "#34D399",
    warn: "#FBBF24",
  },
  crimson_velvet: {
    id: "crimson_velvet",
    name: "مخمل ياقوتي ناري",
    tagline: "وردي ياقوتي فاخر مع تدرجات مرجانية دافئة",
    emoji: "🌹",
    bg: "#0B0408",
    bgAlt: "#160911",
    surface: "#1B0D16",
    surface2: "#281421",
    glass: "rgba(28, 13, 22, 0.86)",
    border: "rgba(251, 113, 133, 0.12)",
    borderGlow: "rgba(244, 63, 94, 0.40)",
    text: "#FFF5F7",
    muted: "#B58E9B",
    primary: "#FB7185",
    primarySoft: "rgba(251, 113, 133, 0.18)",
    accent: "#F97316",
    btnText: "#FFFFFF",
    auroraTop: ["rgba(244, 63, 94, 0.24)", "rgba(249, 115, 22, 0.10)", "rgba(11, 4, 8, 0)"],
    btnGrad: ["#FB7185", "#E11D48"],
    storyGrad: ["#FDA4AF", "#F43F5E", "#F97316"],
    coverGrad: ["#420C1F", "#1F0A14", "#0B0408"],
    cardHighlight: ["rgba(244, 63, 94, 0.18)", "rgba(27, 13, 22, 0.96)"],
    dockBg: "rgba(22, 10, 18, 0.96)",
    heart: "#FB7185",
    verified: "#38BDF8",
    danger: "#EF4444",
    success: "#22C55E",
    warn: "#FBBF24",
  },
};

export const THEME_LIST: AppTheme[] = [
  THEMES.obsidian_gold,
  THEMES.cyber_aurora,
  THEMES.emerald_royal,
  THEMES.crimson_velvet,
];

// Backward-compatible default palette (upgraded to Obsidian & Liquid Gold)
export const COLORS = {
  bg: THEMES.obsidian_gold.bg,
  surface: THEMES.obsidian_gold.surface,
  surface2: THEMES.obsidian_gold.surface2,
  border: THEMES.obsidian_gold.border,
  text: THEMES.obsidian_gold.text,
  muted: THEMES.obsidian_gold.muted,
  primary: THEMES.obsidian_gold.primary,
  accent: THEMES.obsidian_gold.accent,
  heart: THEMES.obsidian_gold.heart,
  verified: THEMES.obsidian_gold.verified,
  danger: THEMES.obsidian_gold.danger,
  success: THEMES.obsidian_gold.success,
  warn: THEMES.obsidian_gold.warn,
};
