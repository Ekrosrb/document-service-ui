import { Author, DocumentKind, MemoryType, Scope } from '@/api/enums'
import { createSearchForm } from '../documentSearch'

export const QUERY = 'palette'
export const PROJECT_KEY = 'document-service-ui'
export const AUTHOR_NAME = 'claude'
export const BLANK = '   '

export const DEFAULT_INCLUDES = Object.freeze({
  includeSummary: true,
  includeSuperseded: false,
})

export function buildFilledSearchForm() {
  return {
    ...createSearchForm(),
    query: `  ${QUERY}  `,
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    author: Author.AGENT,
    memoryType: MemoryType.FACT,
    projectKey: PROJECT_KEY,
    authorName: AUTHOR_NAME,
    includeSuperseded: true,
  }
}

export function buildFilledSearchRequest() {
  return {
    query: QUERY,
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    author: Author.AGENT,
    memoryType: MemoryType.FACT,
    projectKey: PROJECT_KEY,
    authorName: AUTHOR_NAME,
    ...DEFAULT_INCLUDES,
    includeSuperseded: true,
  }
}

export function buildQueryOnlyRequest() {
  return { query: QUERY, ...DEFAULT_INCLUDES }
}

export function buildEmptyRequest() {
  return { ...DEFAULT_INCLUDES }
}
