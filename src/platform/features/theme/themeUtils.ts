import { BRAND } from "@app/brand";
import type { ThemeState } from "./themeSlice";

export type ThemePreset = {
  name: string;
  primary: string;
  onPrimary: string;
};

/** Brand preset; also the app's default theme (see DEFAULT_THEME). */
export const MONTRA_PRESET: ThemePreset = {
  name: "Montra",
  primary: "#0c6fb7",
  onPrimary: "#ffffff",
};

export const THEME_PRESETS: ThemePreset[] = [
  MONTRA_PRESET,
  { name: "Indigo", primary: "#4f46e5", onPrimary: "#ffffff" },
  { name: "Teal", primary: "#0f766e", onPrimary: "#ffffff" },
  { name: "Crimson", primary: "#b42318", onPrimary: "#ffffff" },
  { name: "Graphite", primary: "#1f2937", onPrimary: "#f9fafb" },
  { name: "Sunrise", primary: "#f5b301", onPrimary: "#1f2937" },
  { name: "Paper", primary: "#f1f3f5", onPrimary: "#1f2937" },
  // Pairs: each colour is the other's text (text contrast 4.7–7.7:1)
  { name: "Blueberry", primary: "#344388", onPrimary: "#ffffff" },
  { name: "Cream Soda", primary: "#e9dec0", onPrimary: "#344388" },
  { name: "Clay Brown", primary: "#674136", onPrimary: "#ffffff" },
  { name: "Soft Butter", primary: "#fff1a6", onPrimary: "#674136" },
  { name: "Raspberry", primary: "#a9325c", onPrimary: "#ffffff" },
  { name: "Pale Sky", primary: "#d3e0e9", onPrimary: "#a9325c" },
];

/** "#007a36" -> "0, 122, 54" (the format Bootstrap's --bs-*-rgb variables expect) */
export function hexToRgbTriplet(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// WCAG 2.x relative luminance
function luminance(hex: string): number {
  const [r, g, b] = hexToRgbTriplet(hex)
    .split(",")
    .map((channel) => {
      const c = Number(channel) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Picks dark or light text, whichever reads better on the given background. */
export function readableTextColor(background: string): string {
  return contrastRatio(background, "#ffffff") >=
    contrastRatio(background, "#1f2937")
    ? "#ffffff"
    : "#1f2937";
}

/**
 * The color darkened (mixed with black) until it reaches WCAG AA contrast on white.
 * Used where the main color is drawn as text: links, outline buttons, .text-primary.
 * A dark main color is returned unchanged; a light one (e.g. yellow) gets a readable shade.
 */
export function readableOnWhite(hex: string): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(",").map(Number);
  for (let darken = 0; darken <= 1; darken += 0.05) {
    const shade =
      "#" +
      [r, g, b]
        .map((c) =>
          Math.round(c * (1 - darken))
            .toString(16)
            .padStart(2, "0"),
        )
        .join("");
    if (contrastRatio(shade, "#ffffff") >= 4.5) return shade;
  }
  return "#000000";
}

/** Appearance chosen by the user; "system" follows the computer's light/dark setting */
export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedMode = "light" | "dark";

/** Body background in dark mode (Bootstrap's $body-bg-dark) */
export const DARK_BODY_BG = "#212529";

/** A saved mode, or "system" when missing/unknown (e.g. preferences saved before dark mode) */
export const parseMode = (value: unknown): ThemeMode =>
  (THEME_MODES as readonly unknown[]).includes(value)
    ? (value as ThemeMode)
    : "system";

export const resolveMode = (
  mode: ThemeMode,
  systemPrefersDark: boolean,
): ResolvedMode =>
  mode === "system" ? (systemPrefersDark ? "dark" : "light") : mode;

/**
 * The color lightened (mixed with white) until it reaches WCAG AA contrast on the dark body
 * background: the main color as text (links, outline buttons) in dark mode.
 */
export function readableOnDark(hex: string): string {
  for (let lighten = 0; lighten <= 1; lighten += 0.05) {
    const shade = mixHex(hex, "#ffffff", lighten);
    if (contrastRatio(shade, DARK_BODY_BG) >= 4.5) return shade;
  }
  return "#ffffff";
}

/** Mixes `hex` with `other` (0 = hex, 1 = other), e.g. darken = mix with black. */
function mixHex(hex: string, other: string, amount: number): string {
  const a = hexToRgbTriplet(hex).split(",").map(Number);
  const b = hexToRgbTriplet(other).split(",").map(Number);
  return (
    "#" +
    a
      .map((c, i) =>
        Math.round(c + (b[i] - c) * amount)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

/** Small red dot in the bottom-right corner: "something is still to read". */
const UNREAD_DOT = `
  <circle cx="200" cy="200" r="48" fill="#dc3545" stroke="#ffffff" stroke-width="14"/>`;

/**
 * The app icon (same design as src/assets/favicon.svg), drawn in the theme colors,
 * with a dot when there's something unread (the count goes in the page title).
 */
export function buildFaviconSvg(theme: ThemeState, hasUnread = false): string {
  const dark = mixHex(theme.primary, "#000000", 0.45);
  const light = mixHex(theme.primary, "#ffffff", 0.3);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="55%" stop-color="${theme.primary}"/>
      <stop offset="100%" stop-color="${light}"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="50" fill="url(#g)"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="${theme.onPrimary}"
    font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    font-weight="900" font-size="150">${BRAND.mark}</text>${hasUnread ? UNREAD_DOT : ""}
</svg>`;
}

/** Points the browser tab icon at the theme-colored app icon (with the unread dot). */
export function applyFavicon(theme: ThemeState, hasUnread = false): void {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(theme, hasUnread))}`;
}

/**
 * Writes the theme to <html>: data-bs-theme (Bootstrap light/dark colors) and the CSS variables
 * that styles/theme.scss maps onto Bootstrap. The main color as text gets a shade readable on
 * the mode's background.
 */
export function applyThemeVariables(
  theme: ThemeState,
  mode: ResolvedMode,
): void {
  document.documentElement.setAttribute("data-bs-theme", mode);
  const style = document.documentElement.style;
  const primaryText =
    mode === "dark"
      ? readableOnDark(theme.primary)
      : readableOnWhite(theme.primary);
  style.setProperty("--app-primary", theme.primary);
  style.setProperty("--app-primary-rgb", hexToRgbTriplet(theme.primary));
  style.setProperty("--app-primary-text", primaryText);
  style.setProperty("--app-primary-text-rgb", hexToRgbTriplet(primaryText));
  style.setProperty("--app-on-primary", theme.onPrimary);
  style.setProperty("--app-on-primary-rgb", hexToRgbTriplet(theme.onPrimary));
  style.setProperty("--app-body-color", theme.bodyText);
  style.setProperty("--app-body-color-rgb", hexToRgbTriplet(theme.bodyText));
}
