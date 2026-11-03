import { describe, expect, it } from 'vitest'
import { DocumentKind, MemoryType } from '@/api/enums'
import {
  MEMORY_TYPE_KIND_MESSAGE,
  createSearchForm,
  toSearchRequest,
  validateSearchRequest,
} from '../documentSearch'
import {
  BLANK,
  DEFAULT_INCLUDES,
  buildEmptyRequest,
  buildFilledSearchForm,
  buildFilledSearchRequest,
  buildQueryOnlyRequest,
} from './searchTestData'

describe('toSearchRequest', () => {
  it('trims text and keeps every filled filter and include flag', () => {
    expect(toSearchRequest(buildFilledSearchForm())).toEqual(buildFilledSearchRequest())
  })

  it('leaves out empty and blank filters', () => {
    const form = { ...createSearchForm(), query: BLANK, authorName: BLANK }

    expect(toSearchRequest(form)).toEqual(DEFAULT_INCLUDES)
  })
})

describe('validateSearchRequest', () => {
  it('accepts a request with only a query', () => {
    expect(validateSearchRequest(buildQueryOnlyRequest())).toEqual({})
  })

  it('accepts a fully filled request', () => {
    expect(validateSearchRequest(buildFilledSearchRequest())).toEqual({})
  })

  it('accepts a request with no filters at all', () => {
    expect(validateSearchRequest(buildEmptyRequest())).toEqual({})
  })

  it('rejects memory type together with kind DOCUMENT', () => {
    const request = { ...buildFilledSearchRequest(), kind: DocumentKind.DOCUMENT }

    expect(validateSearchRequest(request)).toEqual({ memoryType: MEMORY_TYPE_KIND_MESSAGE })
  })

  it('accepts memory type without a kind', () => {
    const request = { ...buildEmptyRequest(), memoryType: MemoryType.RULE }

    expect(validateSearchRequest(request)).toEqual({})
  })
})
