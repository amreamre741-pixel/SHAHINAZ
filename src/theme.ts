export type ThemeId =
  | "obsidian_gold"
  | "cyber_aurora"
  | "emerald_royal"
  | "crimson_velvet"
  | "midnight_titanium"
  | "desert_pearl";

export interface AppTheme {
  id: ThemeId;
  name: string;
  tagline: string;
  emoji: string;
  isLight?: boolean;
  statusBarStyle: "light" | "dark";
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
    statusBarStyle: "light",
    bg: "#05060B",
    bgAlt: "#0A0D16",
    surface: "#0E111C",
    surface2: "#161B2B",
    glass: "rgba(18, 22, 36, 0.86)",
    border: "rgba(255, 255, 255, 0.08)",
    borderGlow: "rgba(245, 198, 92, 0.36)",
    text: "#FAF8F4",
    muted: "#8E96AD",
    primary: "#F5C65C",
    primarySoft: "rgba(245, 198, 92, 0.16)",
    accent: "#E88B38",
    btnText: "#090A0F",
    auroraTop: ["rgba(245, 198, 92, 0.22)", "rgba(232, 139, 56, 0.08)", "rgba(5, 6, 11, 0)"],
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
    statusBarStyle: "light",
    bg: "#040712",
    bgAlt: "#091024",
    surface: "#0D152B",
    surface2: "#15203E",
    glass: "rgba(15, 24, 48, 0.88)",
    border: "rgba(148, 163, 184, 0.12)",
    borderGlow: "rgba(56, 189, 248, 0.40)",
    text: "#F8FAFC",
    muted: "#94A3B8",
    primary: "#38BDF8",
    primarySoft: "rgba(56, 189, 248, 0.16)",
    accent: "#A855F7",
    btnText: "#FFFFFF",
    auroraTop: ["rgba(56, 189, 248, 0.24)", "rgba(168, 85, 247, 0.12)", "rgba(4, 7, 18, 0)"],
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
    statusBarStyle: "light",
    bg: "#030B09",
    bgAlt: "#071713",
    surface: "#0B1E19",
    surface2: "#122C25",
    glass: "rgba(11, 30, 25, 0.88)",
    border: "rgba(167, 243, 208, 0.10)",
    borderGlow: "rgba(16, 185, 129, 0.40)",
    text: "#F3FAF7",
    muted: "#84A99E",
    primary: "#10B981",
    primarySoft: "rgba(16, 185, 129, 0.16)",
    accent: "#FBBF24",
    btnText: "#02110C",
    auroraTop: ["rgba(16, 185, 129, 0.24)", "rgba(251, 191, 36, 0.08)", "rgba(3, 11, 9, 0)"],
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
    statusBarStyle: "light",
    bg: "#0B0408",
    bgAlt: "#160911",
    surface: "#1B0D16",
    surface2: "#281421",
    glass: "rgba(28, 13, 22, 0.88)",
    border: "rgba(251, 113, 133, 0.12)",
    borderGlow: "rgba(244, 63, 94, 0.42)",
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
  midnight_titanium: {
    id: "midnight_titanium",
    name: "تيتانيوم أزرق ليلي",
    tagline: "معدن تيتانيوم فضي وأزرق ياقوتي فائق النقاء",
    emoji: "⚡",
    statusBarStyle: "light",
    bg: "#040814",
    bgAlt: "#0A1124",
    surface: "#0F172A",
    surface2: "#1E293B",
    glass: "rgba(15, 23, 42, 0.90)",
    border: "rgba(226, 232, 240, 0.11)",
    borderGlow: "rgba(96, 165, 250, 0.42)",
    text: "#F1F5F9",
    muted: "#94A3B8",
    primary: "#60A5FA",
    primarySoft: "rgba(96, 165, 250, 0.18)",
    accent: "#E2E8F0",
    btnText: "#040814",
    auroraTop: ["rgba(59, 130, 246, 0.25)", "rgba(226, 232, 240, 0.08)", "rgba(4, 8, 20, 0)"],
    btnGrad: ["#E2E8F0", "#60A5FA"],
    storyGrad: ["#F8FAFC", "#60A5FA", "#2563EB"],
    coverGrad: ["#0F254A", "#0C152B", "#040814"],
    cardHighlight: ["rgba(96, 165, 250, 0.18)", "rgba(15, 23, 42, 0.96)"],
    dockBg: "rgba(10, 17, 36, 0.97)",
    heart: "#FB375B",
    verified: "#60A5FA",
    danger: "#EF4444",
    success: "#10B981",
    warn: "#FBBF24",
  },
  desert_pearl: {
    id: "desert_pearl",
    name: "لؤلؤة الصحراء الفاتح",
    tagline: "وضع نهاري فاخر بلون الحرير الدافئ والذهب العتيق",
    emoji: "🤍",
    isLight: true,
    statusBarStyle: "dark",
    bg: "#F6F2EA",
    bgAlt: "#EFE9DD",
    surface: "#FFFFFF",
    surface2: "#EFEAE0",
    glass: "rgba(255, 255, 255, 0.94)",
    border: "rgba(20, 22, 31, 0.09)",
    borderGlow: "rgba(184, 125, 36, 0.38)",
    text: "#14161F",
    muted: "#6B7080",
    primary: "#B87D24",
    primarySoft: "rgba(184, 125, 36, 0.13)",
    accent: "#D97706",
    btnText: "#FFFFFF",
    auroraTop: ["rgba(217, 159, 64, 0.22)", "rgba(246, 242, 234, 0.10)", "rgba(246, 242, 234, 0)"],
    btnGrad: ["#D49B3E", "#9A6414"],
    storyGrad: ["#F59E0B", "#B87D24", "#78350F"],
    coverGrad: ["#E8D5B5", "#F3EADF", "#F6F2EA"],
    cardHighlight: ["rgba(184, 125, 36, 0.14)", "rgba(255, 255, 255, 0.98)"],
    dockBg: "rgba(255, 255, 255, 0.97)",
    heart: "#E11D48",
    verified: "#0284C7",
    danger: "#DC2626",
    success: "#059669",
    warn: "#B87D24",
  },
};

export const THEME_LIST: AppTheme[] = [
  THEMES.obsidian_gold,
  THEMES.midnight_titanium,
  THEMES.cyber_aurora,
  THEMES.emerald_royal,
  THEMES.crimson_velvet,
  THEMES.desert_pearl,
];

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
