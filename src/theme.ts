export type Theme = 'light' | 'dark'

const THEME_KEY = 'green-spain-theme'

export function readTheme(): Theme {
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Storage can be unavailable in private browsing; the device preference still works.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#111312' : '#254e40')
}

export function saveTheme(theme: Theme) {
  applyTheme(theme)
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // The current page can still use the selected theme when storage is unavailable.
  }
}
