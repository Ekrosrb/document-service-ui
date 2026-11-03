import { describe, expect, it } from 'vitest'
import { DARK, LIGHT, THEME_STORAGE_KEY, createTheme } from '../useTheme'
import { buildBlockedStorage, buildRoot, buildStorage } from './themeTestData'

describe('createTheme', () => {
  it('is dark when nothing is stored', () => {
    const root = buildRoot()
    const { dark } = createTheme({ storage: buildStorage(), root })

    expect(dark.value).toBe(true)
    expect(root.classes.has(DARK)).toBe(true)
  })

  it('is light when light is stored', () => {
    const root = buildRoot()
    const { dark } = createTheme({ storage: buildStorage(LIGHT), root })

    expect(dark.value).toBe(false)
    expect(root.classes.has(DARK)).toBe(false)
  })

  it('applies and saves the theme on toggle', () => {
    const root = buildRoot()
    const storage = buildStorage()
    const { dark, toggle } = createTheme({ storage, root })

    toggle()

    expect(dark.value).toBe(false)
    expect(root.classes.has(DARK)).toBe(false)
    expect(storage.setItem).toHaveBeenLastCalledWith(THEME_STORAGE_KEY, LIGHT)

    toggle()

    expect(root.classes.has(DARK)).toBe(true)
    expect(storage.setItem).toHaveBeenLastCalledWith(THEME_STORAGE_KEY, DARK)
  })

  it('falls back to dark and still toggles when storage is blocked', () => {
    const root = buildRoot()
    const { dark, toggle } = createTheme({ storage: buildBlockedStorage(), root })

    expect(dark.value).toBe(true)

    toggle()

    expect(root.classes.has(DARK)).toBe(false)
  })
})
