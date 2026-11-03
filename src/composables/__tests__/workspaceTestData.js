import { DocumentType } from '@/api/enums'

export const PROJECT_KEY = 'document-service-ui'
export const OTHER_PROJECT_KEY = 'payments-api'
export const TRASH_TOTAL = 18

export function buildProjectsPage() {
  return {
    content: [
      { projectKey: PROJECT_KEY, documents: 27 },
      { projectKey: OTHER_PROJECT_KEY, documents: 4 },
    ],
    totalElements: 2,
    last: true,
  }
}

export function buildDocumentTypeCounts() {
  return [
    { type: DocumentType.MARKDOWN, count: 3 },
    { type: DocumentType.JSON, count: 1 },
  ]
}

export function buildMemoryTypeCounts() {
  return [
    { type: DocumentType.TEXT, count: 190 },
    { type: DocumentType.MARKDOWN, count: 2 },
  ]
}

export function buildDeletedPage() {
  return { content: [], totalElements: TRASH_TOTAL, last: false }
}
