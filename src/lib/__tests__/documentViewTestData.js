import { Author, DocumentKind, DocumentType, MemoryType, RelationType, Scope } from '@/api/enums'

export const DOCUMENT_ID = 42
export const NAME = 'Service overview'
export const PROJECT_KEY = 'payments-api'
export const CUSTOM_EXTENSION = '.env.example'

export function buildDocument(overrides = {}) {
  return {
    id: DOCUMENT_ID,
    kind: DocumentKind.DOCUMENT,
    scope: Scope.GLOBAL,
    type: DocumentType.MARKDOWN,
    author: Author.HUMAN,
    memoryType: null,
    name: NAME,
    projectKey: null,
    customExtension: null,
    relations: [],
    referencedBy: [],
    ...overrides,
  }
}

export function buildMemory(overrides = {}) {
  return buildDocument({
    kind: DocumentKind.MEMORY,
    memoryType: MemoryType.DECISION,
    author: Author.AGENT,
    ...overrides,
  })
}

export function buildSupersededDocument() {
  return buildDocument({ referencedBy: [{ id: 7, type: RelationType.SUPERSEDES, name: 'Newer note' }] })
}

export function buildReferencedDocument() {
  return buildDocument({ referencedBy: [{ id: 7, type: RelationType.RELATED_TO, name: 'Related note' }] })
}
