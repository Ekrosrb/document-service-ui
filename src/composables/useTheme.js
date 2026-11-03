import { ref, watch } from 'vue'

export const THEME_STORAGE_KEY = 'document-service-ui:theme'
export const LIGHT = 'light'
export const DARK = 'dark'

/**
 * Creates the color theme state. The theme is dark unless `storage` holds "light"; every
 * change is applied as the `dark` class on `root` and saved to `storage`.
 */
export function createTheme({ storage = browserStorage(), root = document.documentElement } = {}) {
  const dark = ref(readTheme(storage) !== LIGHT)
  root.classList.toggle(DARK, dark.value)

  watch(
    dark,
    (value) => {
      root.classList.toggle(DARK, value)
      writeTheme(storage, value ? DARK : LIGHT)
    },
    { flush: 'sync' },
  )

  return {
    dark,
    toggle: () => (dark.value = !dark.value),
  }
}

let theme = null

/** Returns the app-wide theme state, creating it on first use. */
export function useTheme() {
  theme ??= createTheme()
  return theme
}

function browserStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readTheme(storage) {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function writeTheme(storage, value) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, value)
  } catch {
    return
  }
}
