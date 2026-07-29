# /add-theme — Generate a Complete Visual Theme

When the user runs `/add-theme`, generate a new theme definition with all required color tokens.

## Instructions

Ask the user for:
1. **Theme name** (e.g., "Ocean Breeze")
2. **Type** — light or dark
3. **Accent color** — primary accent hex code (e.g., `#0EA5E9`)
4. **Mood** — one-line description (e.g., "calm, oceanic, refreshing")

Then generate a complete theme object with **all 35+ color tokens**.

### Required Color Tokens

Every theme MUST define all of these tokens:

```javascript
{
  name: "Theme Name",
  type: "light" | "dark",
  colors: {
    // Backgrounds (7)
    bgPrimary, bgSecondary, bgTertiary, bgCard, bgSidebar, bgInput, bgHover, bgActive,

    // Accent (4)
    accent, accentHover, accentLight, accentText,

    // Secondary accent (1)
    secondary,

    // Text (4)
    textPrimary, textSecondary, textMuted, textOnAccent,

    // Borders (3)
    border, borderLight, borderFocus,

    // Status colors (6)
    success, successBg, warning, warningBg, danger, dangerBg,

    // Chat bubbles (4)
    userBubble, userBubbleText, aiBubble, aiBubbleText,

    // Tag colors (2 arrays of 6)
    tags: [6 background colors],
    tagText: [6 text colors],

    // Shadows (2)
    cardShadow, dropShadow,
  }
}
```

### Color Design Rules

For **light** themes:
- `bgPrimary` should be near-white
- `textPrimary` should be dark (800-900 range)
- `bgSidebar` should be slightly tinted with the accent hue
- Shadows use low-opacity dark

For **dark** themes:
- `bgPrimary` should be near-black (< `#1A1A1A`)
- `textPrimary` should be light (100-200 range)
- `accentLight` should be a deep, muted version of the accent
- Shadows use higher-opacity dark or accent-tinted

### Where to add:
1. Add the theme object to `frontend/src/themes/themes.js` inside the `themes` export
2. The theme switcher in `ThemeSwitcher.jsx` auto-picks up new entries — no changes needed
3. Test that the theme renders correctly on all 4 pages (Dashboard, Upload, Matcher, Chat)

### Contrast Requirements:
- `textPrimary` on `bgPrimary` must have WCAG AA contrast ratio (4.5:1 minimum)
- `textOnAccent` on `accent` must have WCAG AA contrast ratio
- `userBubbleText` on `userBubble` must be readable
