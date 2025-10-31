import themes from "./themes.json";

export function applyTheme(themeName) {
  const theme = themes[themeName];

  if (!theme) {
    console.warn(`⚠️ Theme "${themeName}" nicht gefunden.`);
    return;
  }

  // Für jede Farbe aus dem Theme die CSS-Variable setzen
  Object.entries(theme).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--${key}-color`, value);
  });
}
