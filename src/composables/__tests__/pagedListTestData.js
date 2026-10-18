export const PAGE_SIZE = 2
export const SORT = 'projectKey,asc'
export const LIST_OPTIONS = Object.freeze({ size: PAGE_SIZE, sort: SORT })
export const ERROR_MESSAGE = 'Failed to load'
export const TOTAL = 3

export const FIRST_ITEMS = Object.freeze([
  { projectKey: 'cnn', documents: 65 },
  { projectKey: 'document-service-ui', documents: 5 },
])
export const SECOND_ITEMS = Object.freeze([{ projectKey: 'hl-document-service', documents: 56 }])

export function buildPage(content, { last = false } = {}) {
  return { content: [...content], last, totalElements: TOTAL }
}

export function buildFirstPage() {
  return buildPage(FIRST_ITEMS)
}

export function buildLastPage() {
  return buildPage(SECOND_ITEMS, { last: true })
}

export function buildError() {
  return new Error(ERROR_MESSAGE)
}
