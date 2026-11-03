import { DocumentKind, DocumentType, MemoryType, Scope } from '@/api/enums'

export const DOCUMENT_ID = 105
export const NAME = 'document-service-ui purpose and stack'
export const SUMMARY = 'Web UI for the mcp-document-service REST API.'
export const CONTENT = '  Vue 3, Vite, Tailwind 4 and shadcn-vue.\n'
export const PROJECT_KEY = 'document-service-ui'
export const AUTHOR_NAME = 'claude'
export const CUSTOM_EXTENSION = '.adoc'
export const BLANK = '   '

export function buildEditableDocument(overrides = {}) {
  return {
    id: DOCUMENT_ID,
    kind: DocumentKind.MEMORY,
    scope: Scope.PROJECT,
    type: DocumentType.TEXT,
    memoryType: MemoryType.FACT,
    name: NAME,
    authorName: AUTHOR_NAME,
    projectKey: PROJECT_KEY,
    summary: SUMMARY,
    content: CONTENT,
    customExtension: null,
    allowMcpWrite: true,
    ...overrides,
  }
}

export function buildEditForm(overrides = {}) {
  return {
    type: DocumentType.TEXT,
    memoryType: MemoryType.FACT,
    name: NAME,
    authorName: AUTHOR_NAME,
    projectKey: PROJECT_KEY,
    summary: SUMMARY,
    content: CONTENT,
    customExtension: '',
    allowMcpWrite: true,
    ...overrides,
  }
}
