import { Author, DocumentKind, DocumentType, MemoryType, RelationType, Scope } from '../enums'

export const DOCUMENT_ID = 105
export const RELATED_DOCUMENT_ID = 203
export const PROJECT_KEY = 'document-service-ui'
export const DOCUMENT_NAME = 'document-service-ui purpose and stack'
export const DOCUMENT_SUMMARY = 'Web UI for the mcp-document-service REST API.'
export const DOCUMENT_CONTENT = 'Vue 3, Vite, Tailwind 4 and shadcn-vue.'
export const AUTHOR_NAME = 'document-service-ui'
export const SEARCH_QUERY = 'stack'
export const TIMESTAMP = '2026-10-18T20:42:04.767Z'
export const ERROR_MESSAGE = `Document with id [${DOCUMENT_ID}] not found`
export const VALIDATION_MESSAGE = 'Request validation failed'
export const NETWORK_ERROR_MESSAGE = 'Network Error'

export const PAGEABLE = Object.freeze({ page: 1, size: 20, sort: ['name,asc', 'id,desc'] })
export const INCLUDE_CONTENT = Object.freeze({ includeContent: true })

export function buildDocumentResponse(overrides = {}) {
  return {
    id: DOCUMENT_ID,
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    type: DocumentType.TEXT,
    author: Author.AGENT,
    memoryType: MemoryType.FACT,
    name: DOCUMENT_NAME,
    authorName: AUTHOR_NAME,
    projectKey: PROJECT_KEY,
    relations: [buildDocumentRelation()],
    referencedBy: [],
    summary: DOCUMENT_SUMMARY,
    content: DOCUMENT_CONTENT,
    customExtension: null,
    allowMcpWrite: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    deletedAt: null,
    ...overrides,
  }
}

export function buildDeletedDocumentResponse() {
  return buildDocumentResponse({ deletedAt: TIMESTAMP })
}

export function buildDocumentRelation() {
  return { relatedDocumentId: RELATED_DOCUMENT_ID, type: RelationType.SUPERSEDES }
}

export function buildDocumentCreateRequest() {
  return {
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    type: DocumentType.TEXT,
    author: Author.HUMAN,
    memoryType: MemoryType.FACT,
    name: DOCUMENT_NAME,
    authorName: AUTHOR_NAME,
    projectKey: PROJECT_KEY,
    summary: DOCUMENT_SUMMARY,
    content: DOCUMENT_CONTENT,
    allowMcpWrite: true,
    relations: [buildDocumentRelation()],
  }
}

export function buildDocumentCreateResponse() {
  return { id: DOCUMENT_ID }
}

export function buildDocumentUpdateRequest() {
  return {
    name: DOCUMENT_NAME,
    summary: DOCUMENT_SUMMARY,
    content: DOCUMENT_CONTENT,
    memoryType: MemoryType.DECISION,
  }
}

export function buildDocumentSearchRequest() {
  return {
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    projectKey: PROJECT_KEY,
    query: SEARCH_QUERY,
    includeSummary: true,
  }
}

export function buildRelationCreateRequest() {
  return {
    documentId: DOCUMENT_ID,
    relatedDocumentId: RELATED_DOCUMENT_ID,
    type: RelationType.SUPERSEDES,
  }
}

export function buildProjectsInfo() {
  return { projectKey: PROJECT_KEY, documents: 2 }
}

export function buildPage(content) {
  return {
    content,
    number: PAGEABLE.page,
    size: PAGEABLE.size,
    numberOfElements: content.length,
    totalElements: content.length,
    totalPages: 1,
    first: true,
    last: true,
    empty: content.length === 0,
  }
}

export function buildNotFoundError() {
  return { message: ERROR_MESSAGE, metadata: { id: DOCUMENT_ID } }
}

export function buildValidationError() {
  return {
    message: VALIDATION_MESSAGE,
    metadata: { content: 'must not be blank', kind: 'must not be null' },
  }
}
