import { describe, expect, it } from 'vitest'
import { formatDateTime, formatEnum } from '../format'
import { MULTI_WORD_ENUM, SINGLE_WORD_ENUM, TIMESTAMP } from './formatTestData'

describe('formatEnum', () => {
  it('capitalises a one-word constant', () => {
    expect(formatEnum(SINGLE_WORD_ENUM)).toBe('Decision')
  })

  it('turns underscores into spaces and keeps only the first capital', () => {
    expect(formatEnum(MULTI_WORD_ENUM)).toBe('Depends on')
  })

  it('is empty for a missing value', () => {
    expect(formatEnum('')).toBe('')
    expect(formatEnum(null)).toBe('')
    expect(formatEnum(undefined)).toBe('')
  })
})

describe('formatDateTime', () => {
  it('writes a timestamp as a local date and time', () => {
    const formatted = formatDateTime(TIMESTAMP)

    expect(formatted).toContain('2026')
    expect(formatted).toBe(new Date(TIMESTAMP).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }))
  })

  it('is empty for a missing value', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime('')).toBe('')
  })
})
