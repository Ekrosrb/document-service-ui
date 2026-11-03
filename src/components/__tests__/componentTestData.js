import { Author, DocumentKind, DocumentType, MemoryType, RelationType, Scope } from '@/api/enums'

export const DOCUMENT_ID = 105
export const RELATED_ID = 203
export const DOCUMENT_NAME = 'Service overview'
export const RELATED_NAME = 'Search request example'
export const SUMMARY = 'What the document service stores and who calls it.'
export const CONTENT = 'First line\nSecond line'
export const PROJECT_KEY = 'document-service-ui'
export const OTHER_PROJECT_KEY = 'payments-api'
export const AUTHOR_NAME = 'Mira Kovač'
export const CREATED_AT = '2026-09-02T10:00:00.000Z'
export const UPDATED_AT = '2026-11-03T09:12:00.000Z'
export const DELETED_AT = '2026-11-03T15:49:00.000Z'
export const ERROR_MESSAGE = 'Service unavailable'

export function buildDocument(overrides = {}) {
  return {
    id: DOCUMENT_ID,
    kind: DocumentKind.DOCUMENT,
    scope: Scope.PROJECT,
    type: DocumentType.MARKDOWN,
    author: Author.HUMAN,
    memoryType: null,
    name: DOCUMENT_NAME,
    authorName: AUTHOR_NAME,
    projectKey: PROJECT_KEY,
    summary: SUMMARY,
    content: CONTENT,
    customExtension: null,
    allowMcpWrite: true,
    relations: [],
    referencedBy: [],
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    deletedAt: null,
    ...overrides,
  }
}

export function buildMemory(overrides = {}) {
  return buildDocument({
    kind: DocumentKind.MEMORY,
    memoryType: MemoryType.DECISION,
    author: Author.AGENT,
    type: DocumentType.TEXT,
    ...overrides,
  })
}

export function buildDeletedDocument(overrides = {}) {
  return buildDocument({ deletedAt: DELETED_AT, ...overrides })
}

export function buildRelation(overrides = {}) {
  return { id: RELATED_ID, name: RELATED_NAME, type: RelationType.DEPENDS_ON, ...overrides }
}

export function buildPage(content, overrides = {}) {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    last: true,
    ...overrides,
  }
}

export function buildProjects() {
  return [
    { projectKey: PROJECT_KEY, documents: 27 },
    { projectKey: OTHER_PROJECT_KEY, documents: 4 },
  ]
}

export function buildApiError(message = ERROR_MESSAGE, metadata = {}) {
  return Object.assign(new Error(message), { metadata })
}

/** Text of a wrapper with its whitespace collapsed, so assertions stay readable. */
export function textOf(wrapper) {
  return wrapper.text().replace(/\s+/g, ' ').trim()
}
