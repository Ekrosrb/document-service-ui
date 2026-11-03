import { ref, shallowRef } from 'vue'
import { RelationType } from '@/api/enums'
import { buildDocument, buildMemory, buildProjects } from '@/components/__tests__/componentTestData'

export const PAGE_SIZE = 20
export const SEARCH_TEXT = 'palette'

/** The request the screen sends when nothing is filtered. */
export const UNFILTERED_REQUEST = Object.freeze({
  includeSummary: true,
  includeRelations: false,
  includeSuperseded: false,
})

export const DEFAULT_PAGEABLE = Object.freeze({ page: 0, size: PAGE_SIZE, sort: 'updatedAt,desc' })

export function buildResults() {
  return [buildDocument(), buildMemory({ id: 2, name: 'Use Postgres full-text search' })]
}

export function buildSupersededDocument() {
  return buildDocument({ id: 3, name: 'Old note', referencedBy: [{ id: 4, name: 'New note', type: RelationType.SUPERSEDES }] })
}

export function buildResultPage(content = buildResults(), overrides = {}) {
  return { content, totalElements: content.length, totalPages: 1, number: 0, last: true, ...overrides }
}

/** A stand-in for the shared workspace state; only the project list matters here. */
export function buildWorkspace() {
  return {
    projects: ref(buildProjects()),
    documentCount: ref(null),
    memoryCount: ref(null),
    trashCount: ref(null),
    documentTypeCounts: ref({}),
    memoryTypeCounts: ref({}),
    error: shallowRef(null),
    loadProjects: () => Promise.resolve([]),
    loadTrashCount: () => Promise.resolve(),
    loadCounts: () => Promise.resolve(),
    refresh: () => Promise.resolve(),
  }
}
