import { vi } from 'vitest'
import { THEME_STORAGE_KEY } from '../useTheme'

export function buildStorage(storedTheme) {
  const values = new Map(storedTheme ? [[THEME_STORAGE_KEY, storedTheme]] : [])
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
  }
}

export function buildBlockedStorage() {
  const blocked = () => {
    throw new Error('Storage is blocked')
  }
  return { getItem: vi.fn(blocked), setItem: vi.fn(blocked) }
}

export function buildRoot() {
  const classes = new Set()
  return {
    classes,
    classList: {
      toggle: vi.fn((name, force) => (force ? classes.add(name) : classes.delete(name))),
    },
  }
}
