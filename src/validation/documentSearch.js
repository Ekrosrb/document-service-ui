import { DocumentKind } from '@/api/enums'

export const SEARCH_FILTER_FIELDS = Object.freeze(['query', 'kind', 'scope', 'author', 'memoryType', 'projectKey', 'authorName'])
export const SEARCH_INCLUDE_FIELDS = Object.freeze(['includeSummary', 'includeRelations', 'includeSuperseded'])

export const MEMORY_TYPE_KIND_MESSAGE = 'Memory type can only be used with kind MEMORY.'

/**
 * Returns an empty search form. A form with nothing filled in lists every live entry.
 * Summaries are always included, because the result rows show them; relations only when
 * superseded entries are included, since the "Superseded" marker is read from
 * `referencedBy` and nothing else needs them.
 */
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
    includeRelations: false,
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
 * Checks a search request against the server's rules. Returns messages keyed by field;
 * an empty object means valid.
 */
export function validateSearchRequest(request) {
  const errors = {}
  if (request.memoryType && request.kind === DocumentKind.DOCUMENT) {
    errors.memoryType = MEMORY_TYPE_KIND_MESSAGE
  }
  return errors
}
