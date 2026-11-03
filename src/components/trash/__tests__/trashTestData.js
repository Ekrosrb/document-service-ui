import { buildDeletedDocument } from '@/components/__tests__/componentTestData'

export const DEFAULT_PAGEABLE = Object.freeze({ page: 0, size: 20, sort: 'deletedAt,desc' })

export function buildDeletedRows() {
  return [buildDeletedDocument(), buildDeletedDocument({ id: 2, name: 'Old onboarding notes' })]
}

export function buildDeletedPage(content = buildDeletedRows(), overrides = {}) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, last: true, ...overrides }
}
