// ─────────────────────────────────────────────────────────────────────────────
// HireMinds AI — Theme System
// 8 themes: 3 light + 5 dark.  Every theme has 40+ tokens ensuring full
// coverage across all components.  Color relationships are derived with
// proper contrast ratios (WCAG AA minimum) and harmonious palettes.
//
// Design principles:
//   • Light themes: clean white/gray backgrounds, subtle accent tints only
//     in interactive elements, neutral text hierarchy
//   • Dark themes: deep true-dark backgrounds, muted accent highlights,
//     proper contrast without oversaturation
//   • All themes use neutral grays for textMuted/textSecondary (never
//     tinted green/purple/etc.) to keep readability professional
// ─────────────────────────────────────────────────────────────────────────────

export const themes = {

  // ═══════════════════════ LIGHT THEMES ═══════════════════════

  aurora: {
    name: "Aurora",
    type: "light",
    description: "Clean blue workspace",
    preview: ["#2563EB", "#7C3AED", "#FFFFFF"],
    colors: {
      // Backgrounds — clean whites and very light grays
      bgPrimary: "#FFFFFF",
      bgSecondary: "#F8FAFC",
      bgTertiary: "#F1F5F9",
      bgCard: "#FFFFFF",
      bgSidebar: "#FAFBFD",
      bgInput: "#FFFFFF",
      bgHover: "#F1F5F9",
      bgActive: "#E0EAFF",

      // Accent — professional blue
      accent: "#2563EB",
      accentHover: "#1D4ED8",
      accentLight: "#EFF6FF",
      accentText: "#1E40AF",
      secondary: "#7C3AED",

      // Text — neutral slate hierarchy
      textPrimary: "#0F172A",
      textSecondary: "#475569",
      textMuted: "#94A3B8",
      textOnAccent: "#FFFFFF",

      // Borders — subtle grays
      border: "#E2E8F0",
      borderLight: "#F1F5F9",
      borderFocus: "#2563EB",

      // Status
      success: "#059669",
      successBg: "#ECFDF5",
      warning: "#D97706",
      warningBg: "#FFFBEB",
      danger: "#DC2626",
      dangerBg: "#FEF2F2",

      // Chat
      userBubble: "#2563EB",
      userBubbleText: "#FFFFFF",
      aiBubble: "#F1F5F9",
      aiBubbleText: "#0F172A",

      // Tags — 6 soft pastel pairs
      tags: ["#EFF6FF", "#F5F3FF", "#ECFDF5", "#FFFBEB", "#FEF2F2", "#ECFEFF"],
      tagText: ["#1E40AF", "#5B21B6", "#065F46", "#92400E", "#991B1B", "#155E75"],

      // Shadows — light and subtle
      cardShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      dropShadow: "0 4px 12px rgba(0,0,0,0.06)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #2563EB, #7C3AED)",
      gradientSubtle: "linear-gradient(135deg, #F8FAFC, #F5F3FF)",
      gradientCard: "linear-gradient(180deg, #FFFFFF, #FAFBFD)",

      // Glow
      glowAccent: "0 0 20px rgba(37,99,235,0.12)",
      glowSuccess: "0 0 20px rgba(5,150,105,0.10)",

      // Skeleton
      skeletonBase: "#E2E8F0",
      skeletonShine: "#F1F5F9",

      // Scrollbar
      scrollbarThumb: "rgba(148,163,184,0.35)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#2563EB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#06B6D4"],
    }
  },

  sunset: {
    name: "Sunset Warm",
    type: "light",
    description: "Warm amber tones",
    preview: ["#EA580C", "#B45309", "#FFFFFF"],
    colors: {
      // Backgrounds — clean whites with very subtle warmth
      bgPrimary: "#FFFFFF",
      bgSecondary: "#FAFAF9",
      bgTertiary: "#F5F5F4",
      bgCard: "#FFFFFF",
      bgSidebar: "#FAFAF9",
      bgInput: "#FFFFFF",
      bgHover: "#F5F5F4",
      bgActive: "#FFF1E6",

      // Accent — warm orange
      accent: "#EA580C",
      accentHover: "#C2410C",
      accentLight: "#FFF7ED",
      accentText: "#9A3412",
      secondary: "#B45309",

      // Text — warm neutral hierarchy
      textPrimary: "#1C1917",
      textSecondary: "#57534E",
      textMuted: "#A8A29E",
      textOnAccent: "#FFFFFF",

      // Borders — warm grays
      border: "#E7E5E4",
      borderLight: "#F5F5F4",
      borderFocus: "#EA580C",

      // Status
      success: "#059669",
      successBg: "#ECFDF5",
      warning: "#D97706",
      warningBg: "#FFFBEB",
      danger: "#DC2626",
      dangerBg: "#FEF2F2",

      // Chat
      userBubble: "#EA580C",
      userBubbleText: "#FFFFFF",
      aiBubble: "#F5F5F4",
      aiBubbleText: "#1C1917",

      // Tags
      tags: ["#FFF7ED", "#FFFBEB", "#ECFDF5", "#EFF6FF", "#FEF2F2", "#F5F3FF"],
      tagText: ["#9A3412", "#92400E", "#065F46", "#1E40AF", "#991B1B", "#5B21B6"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      dropShadow: "0 4px 12px rgba(0,0,0,0.06)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #EA580C, #D97706)",
      gradientSubtle: "linear-gradient(135deg, #FAFAF9, #FFF7ED)",
      gradientCard: "linear-gradient(180deg, #FFFFFF, #FAFAF9)",

      // Glow
      glowAccent: "0 0 20px rgba(234,88,12,0.12)",
      glowSuccess: "0 0 20px rgba(5,150,105,0.10)",

      // Skeleton
      skeletonBase: "#E7E5E4",
      skeletonShine: "#F5F5F4",

      // Scrollbar
      scrollbarThumb: "rgba(168,162,158,0.35)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#EA580C", "#B45309", "#059669", "#2563EB", "#DC2626", "#7C3AED"],
    }
  },

  roseGold: {
    name: "Rose Gold",
    type: "light",
    description: "Elegant pink & gold",
    preview: ["#E11D48", "#A21CAF", "#FFFFFF"],
    colors: {
      // Backgrounds — clean whites
      bgPrimary: "#FFFFFF",
      bgSecondary: "#FAFAFA",
      bgTertiary: "#F5F5F5",
      bgCard: "#FFFFFF",
      bgSidebar: "#FAFAFA",
      bgInput: "#FFFFFF",
      bgHover: "#F5F5F5",
      bgActive: "#FFE4E6",

      // Accent — elegant rose
      accent: "#E11D48",
      accentHover: "#BE185D",
      accentLight: "#FFF1F2",
      accentText: "#9F1239",
      secondary: "#A21CAF",

      // Text — neutral hierarchy
      textPrimary: "#18181B",
      textSecondary: "#52525B",
      textMuted: "#A1A1AA",
      textOnAccent: "#FFFFFF",

      // Borders — neutral grays
      border: "#E4E4E7",
      borderLight: "#F4F4F5",
      borderFocus: "#E11D48",

      // Status
      success: "#059669",
      successBg: "#ECFDF5",
      warning: "#D97706",
      warningBg: "#FFFBEB",
      danger: "#DC2626",
      dangerBg: "#FEF2F2",

      // Chat
      userBubble: "#E11D48",
      userBubbleText: "#FFFFFF",
      aiBubble: "#F5F5F5",
      aiBubbleText: "#18181B",

      // Tags
      tags: ["#FFF1F2", "#FDF4FF", "#ECFDF5", "#EFF6FF", "#FFFBEB", "#ECFEFF"],
      tagText: ["#9F1239", "#86198F", "#065F46", "#1E40AF", "#92400E", "#155E75"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      dropShadow: "0 4px 12px rgba(0,0,0,0.06)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #E11D48, #A21CAF)",
      gradientSubtle: "linear-gradient(135deg, #FAFAFA, #FFF1F2)",
      gradientCard: "linear-gradient(180deg, #FFFFFF, #FAFAFA)",

      // Glow
      glowAccent: "0 0 20px rgba(225,29,72,0.12)",
      glowSuccess: "0 0 20px rgba(5,150,105,0.10)",

      // Skeleton
      skeletonBase: "#E4E4E7",
      skeletonShine: "#F4F4F5",

      // Scrollbar
      scrollbarThumb: "rgba(161,161,170,0.35)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#E11D48", "#A21CAF", "#059669", "#2563EB", "#D97706", "#06B6D4"],
    }
  },

  // ═══════════════════════ DARK THEMES ═══════════════════════

  midnight: {
    name: "Midnight",
    type: "dark",
    description: "Deep dark with cyan glow",
    preview: ["#06B6D4", "#A855F7", "#09090B"],
    colors: {
      // Backgrounds — true deep blacks
      bgPrimary: "#09090B",
      bgSecondary: "#111113",
      bgTertiary: "#1A1A1F",
      bgCard: "#111113",
      bgSidebar: "#09090B",
      bgInput: "#1A1A1F",
      bgHover: "#1F1F25",
      bgActive: "#0E3A47",

      // Accent — vibrant cyan
      accent: "#06B6D4",
      accentHover: "#0891B2",
      accentLight: "#0C2D38",
      accentText: "#22D3EE",
      secondary: "#A855F7",

      // Text — neutral zinc hierarchy (no tinting)
      textPrimary: "#FAFAFA",
      textSecondary: "#A1A1AA",
      textMuted: "#71717A",
      textOnAccent: "#FFFFFF",

      // Borders — subtle dark borders
      border: "#27272A",
      borderLight: "#1F1F23",
      borderFocus: "#06B6D4",

      // Status
      success: "#34D399",
      successBg: "#052E20",
      warning: "#FBBF24",
      warningBg: "#3D2A08",
      danger: "#F87171",
      dangerBg: "#3B1111",

      // Chat
      userBubble: "#06B6D4",
      userBubbleText: "#FFFFFF",
      aiBubble: "#1A1A1F",
      aiBubbleText: "#FAFAFA",

      // Tags — deep muted tones
      tags: ["#0C2D38", "#1E0A3E", "#052E20", "#3D2A08", "#3B1111", "#0E1B4D"],
      tagText: ["#22D3EE", "#C084FC", "#6EE7B7", "#FCD34D", "#FCA5A5", "#A5B4FC"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
      dropShadow: "0 4px 16px rgba(0,0,0,0.6)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #06B6D4, #A855F7)",
      gradientSubtle: "linear-gradient(135deg, #111113, #13101F)",
      gradientCard: "linear-gradient(180deg, #141416, #111113)",

      // Glow
      glowAccent: "0 0 24px rgba(6,182,212,0.15)",
      glowSuccess: "0 0 20px rgba(52,211,153,0.12)",

      // Skeleton
      skeletonBase: "#1A1A1F",
      skeletonShine: "#27272D",

      // Scrollbar
      scrollbarThumb: "rgba(113,113,122,0.4)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#06B6D4", "#A855F7", "#34D399", "#FBBF24", "#F87171", "#818CF8"],
    }
  },

  forest: {
    name: "Forest",
    type: "dark",
    description: "Deep green canopy",
    preview: ["#34D399", "#10B981", "#0A0F0D"],
    colors: {
      // Backgrounds — deep neutral-dark with very subtle green undertone
      bgPrimary: "#0A0F0D",
      bgSecondary: "#101613",
      bgTertiary: "#181F1B",
      bgCard: "#101613",
      bgSidebar: "#090E0C",
      bgInput: "#181F1B",
      bgHover: "#1E2722",
      bgActive: "#0D3024",

      // Accent — fresh emerald
      accent: "#34D399",
      accentHover: "#10B981",
      accentLight: "#0A2A1D",
      accentText: "#6EE7B7",
      secondary: "#2DD4BF",

      // Text — NEUTRAL grays (not green-tinted!)
      textPrimary: "#F1F5F2",
      textSecondary: "#9CA3A0",
      textMuted: "#6B7370",
      textOnAccent: "#022C22",

      // Borders — neutral dark
      border: "#212926",
      borderLight: "#1A211E",
      borderFocus: "#34D399",

      // Status
      success: "#34D399",
      successBg: "#052E20",
      warning: "#FBBF24",
      warningBg: "#3D2A08",
      danger: "#F87171",
      dangerBg: "#3B1111",

      // Chat
      userBubble: "#34D399",
      userBubbleText: "#022C22",
      aiBubble: "#181F1B",
      aiBubbleText: "#F1F5F2",

      // Tags
      tags: ["#0A2A1D", "#0A2929", "#0E1B4D", "#2E1065", "#3D2A08", "#3B1111"],
      tagText: ["#6EE7B7", "#5EEAD4", "#93C5FD", "#C4B5FD", "#FCD34D", "#FCA5A5"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
      dropShadow: "0 4px 16px rgba(0,0,0,0.6)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #34D399, #2DD4BF)",
      gradientSubtle: "linear-gradient(135deg, #101613, #0F1A1A)",
      gradientCard: "linear-gradient(180deg, #131A16, #101613)",

      // Glow
      glowAccent: "0 0 24px rgba(52,211,153,0.15)",
      glowSuccess: "0 0 20px rgba(52,211,153,0.12)",

      // Skeleton
      skeletonBase: "#181F1B",
      skeletonShine: "#242C27",

      // Scrollbar
      scrollbarThumb: "rgba(107,115,112,0.4)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#34D399", "#2DD4BF", "#FBBF24", "#93C5FD", "#F87171", "#C4B5FD"],
    }
  },

  obsidian: {
    name: "Obsidian",
    type: "dark",
    description: "Rich purple depths",
    preview: ["#8B5CF6", "#EC4899", "#0B0A14"],
    colors: {
      // Backgrounds — deep true-dark with very subtle purple
      bgPrimary: "#0B0A14",
      bgSecondary: "#100F1C",
      bgTertiary: "#181626",
      bgCard: "#100F1C",
      bgSidebar: "#090812",
      bgInput: "#181626",
      bgHover: "#1E1C30",
      bgActive: "#1F0E4A",

      // Accent — vibrant purple
      accent: "#8B5CF6",
      accentHover: "#7C3AED",
      accentLight: "#160C38",
      accentText: "#C4B5FD",
      secondary: "#EC4899",

      // Text — neutral hierarchy
      textPrimary: "#F5F3FF",
      textSecondary: "#A8A3B8",
      textMuted: "#6E6A82",
      textOnAccent: "#FFFFFF",

      // Borders
      border: "#232038",
      borderLight: "#1C1A2C",
      borderFocus: "#8B5CF6",

      // Status
      success: "#34D399",
      successBg: "#052E20",
      warning: "#FBBF24",
      warningBg: "#3D2A08",
      danger: "#FB7185",
      dangerBg: "#3B0E1A",

      // Chat
      userBubble: "#8B5CF6",
      userBubbleText: "#FFFFFF",
      aiBubble: "#181626",
      aiBubbleText: "#F5F3FF",

      // Tags
      tags: ["#160C38", "#300826", "#0E1B4D", "#052E20", "#3D2A08", "#0A2929"],
      tagText: ["#C4B5FD", "#F9A8D4", "#93C5FD", "#6EE7B7", "#FCD34D", "#5EEAD4"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
      dropShadow: "0 4px 16px rgba(0,0,0,0.6)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #8B5CF6, #EC4899)",
      gradientSubtle: "linear-gradient(135deg, #100F1C, #150E25)",
      gradientCard: "linear-gradient(180deg, #131120, #100F1C)",

      // Glow
      glowAccent: "0 0 24px rgba(139,92,246,0.15)",
      glowSuccess: "0 0 20px rgba(52,211,153,0.12)",

      // Skeleton
      skeletonBase: "#181626",
      skeletonShine: "#252238",

      // Scrollbar
      scrollbarThumb: "rgba(110,106,130,0.4)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#8B5CF6", "#EC4899", "#34D399", "#FBBF24", "#818CF8", "#F87171"],
    }
  },

  ocean: {
    name: "Ocean",
    type: "dark",
    description: "Deep sea blue calm",
    preview: ["#3B82F6", "#06B6D4", "#0A0F1A"],
    colors: {
      // Backgrounds — deep navy-blacks
      bgPrimary: "#0A0F1A",
      bgSecondary: "#0F1525",
      bgTertiary: "#171E2E",
      bgCard: "#0F1525",
      bgSidebar: "#090D18",
      bgInput: "#171E2E",
      bgHover: "#1C2536",
      bgActive: "#102A4C",

      // Accent — ocean blue
      accent: "#3B82F6",
      accentHover: "#2563EB",
      accentLight: "#0F2247",
      accentText: "#93C5FD",
      secondary: "#06B6D4",

      // Text — neutral slate hierarchy
      textPrimary: "#F1F5F9",
      textSecondary: "#94A3B8",
      textMuted: "#64748B",
      textOnAccent: "#FFFFFF",

      // Borders
      border: "#1E293B",
      borderLight: "#172032",
      borderFocus: "#3B82F6",

      // Status
      success: "#34D399",
      successBg: "#052E20",
      warning: "#FBBF24",
      warningBg: "#3D2A08",
      danger: "#F87171",
      dangerBg: "#3B1111",

      // Chat
      userBubble: "#3B82F6",
      userBubbleText: "#FFFFFF",
      aiBubble: "#171E2E",
      aiBubbleText: "#F1F5F9",

      // Tags
      tags: ["#0F2247", "#0C2D38", "#052E20", "#3D2A08", "#3B1111", "#1E0A3E"],
      tagText: ["#93C5FD", "#22D3EE", "#6EE7B7", "#FCD34D", "#FCA5A5", "#C084FC"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
      dropShadow: "0 4px 16px rgba(0,0,0,0.6)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #3B82F6, #06B6D4)",
      gradientSubtle: "linear-gradient(135deg, #0F1525, #0F1C33)",
      gradientCard: "linear-gradient(180deg, #121929, #0F1525)",

      // Glow
      glowAccent: "0 0 24px rgba(59,130,246,0.15)",
      glowSuccess: "0 0 20px rgba(52,211,153,0.12)",

      // Skeleton
      skeletonBase: "#171E2E",
      skeletonShine: "#222D40",

      // Scrollbar
      scrollbarThumb: "rgba(100,116,139,0.4)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#3B82F6", "#06B6D4", "#34D399", "#FBBF24", "#F87171", "#A78BFA"],
    }
  },

  charcoal: {
    name: "Charcoal",
    type: "dark",
    description: "Minimal neutral dark",
    preview: ["#F97316", "#EAB308", "#121212"],
    colors: {
      // Backgrounds — pure neutral grays, no color tint
      bgPrimary: "#121212",
      bgSecondary: "#181818",
      bgTertiary: "#212121",
      bgCard: "#181818",
      bgSidebar: "#0F0F0F",
      bgInput: "#212121",
      bgHover: "#282828",
      bgActive: "#362008",

      // Accent — warm orange
      accent: "#F97316",
      accentHover: "#EA580C",
      accentLight: "#2A1508",
      accentText: "#FDBA74",
      secondary: "#EAB308",

      // Text — pure neutral hierarchy
      textPrimary: "#FAFAFA",
      textSecondary: "#A3A3A3",
      textMuted: "#737373",
      textOnAccent: "#FFFFFF",

      // Borders — pure neutral
      border: "#2A2A2A",
      borderLight: "#222222",
      borderFocus: "#F97316",

      // Status
      success: "#34D399",
      successBg: "#052E20",
      warning: "#FBBF24",
      warningBg: "#3D2A08",
      danger: "#F87171",
      dangerBg: "#3B1111",

      // Chat
      userBubble: "#F97316",
      userBubbleText: "#FFFFFF",
      aiBubble: "#212121",
      aiBubbleText: "#FAFAFA",

      // Tags
      tags: ["#2A1508", "#2A2006", "#052E20", "#0F2247", "#3B1111", "#1E0A3E"],
      tagText: ["#FDBA74", "#FDE047", "#6EE7B7", "#93C5FD", "#FCA5A5", "#C084FC"],

      // Shadows
      cardShadow: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)",
      dropShadow: "0 4px 16px rgba(0,0,0,0.6)",

      // Gradients
      gradientPrimary: "linear-gradient(135deg, #F97316, #EAB308)",
      gradientSubtle: "linear-gradient(135deg, #181818, #1C1A14)",
      gradientCard: "linear-gradient(180deg, #1C1C1C, #181818)",

      // Glow
      glowAccent: "0 0 24px rgba(249,115,22,0.15)",
      glowSuccess: "0 0 20px rgba(52,211,153,0.12)",

      // Skeleton
      skeletonBase: "#212121",
      skeletonShine: "#2E2E2E",

      // Scrollbar
      scrollbarThumb: "rgba(115,115,115,0.4)",
      scrollbarTrack: "transparent",

      // Charts
      chart: ["#F97316", "#EAB308", "#34D399", "#3B82F6", "#F87171", "#A78BFA"],
    }
  },
};

// Helper: get ordered theme list (light first, then dark)
export const themeOrder = ['aurora', 'sunset', 'roseGold', 'midnight', 'ocean', 'obsidian', 'forest', 'charcoal'];

// Helper: get themes by type
export const lightThemes = themeOrder.filter(k => themes[k].type === 'light');
export const darkThemes = themeOrder.filter(k => themes[k].type === 'dark');
