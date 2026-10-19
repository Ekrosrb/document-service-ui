import { DocumentKind } from '@/api/enums'

export const SEARCH_FILTER_FIELDS = Object.freeze(['query', 'kind', 'scope', 'author', 'memoryType', 'projectKey', 'authorName'])
export const SEARCH_INCLUDE_FIELDS = Object.freeze(['includeSummary', 'includeSuperseded'])

export const AT_LEAST_ONE_FILTER_MESSAGE = 'Fill in at least one filter or a search query.'
export const MEMORY_TYPE_KIND_MESSAGE = 'Memory type can only be used with kind MEMORY.'

/** Returns an empty search form; summaries are included by default. */
export function createSearchForm() {
  return {
    query: '',
    kind: '',
    scope: '',
    author: '',
    memoryType: '',
    projectKey: '',
    authorName: '',
    includeSummary: true,
    includeSuperseded: false,
  }
}

/** Builds a DocumentSearchRequest from form values, trimming text and leaving out empty filters. */
export function toSearchRequest(form) {
  const request = {}
  for (const field of SEARCH_FILTER_FIELDS) {
    const value = form[field]?.trim()
    if (value) request[field] = value
  }
  for (const field of SEARCH_INCLUDE_FIELDS) {
    request[field] = Boolean(form[field])
  }
  return request
}

/**
 * Checks a search request against the server's rules. Returns messages keyed by field,
 * with `form` for errors that belong to the whole form; an empty object means valid.
 */
export function validateSearchRequest(request) {
  const errors = {}
  if (!SEARCH_FILTER_FIELDS.some((field) => request[field])) {
    errors.form = AT_LEAST_ONE_FILTER_MESSAGE
  }
  if (request.memoryType && request.kind === DocumentKind.DOCUMENT) {
    errors.memoryType = MEMORY_TYPE_KIND_MESSAGE
  }
  return errors
}
