import { ref, shallowRef } from 'vue'

export const SCREEN_NAMES = Object.freeze([
  'OverviewScreen',
  'DocumentsScreen',
  'DocumentDetail',
  'DocumentEditor',
  'TrashScreen',
])

/** Every screen replaced by a marker, so only the shell's own wiring is under test. */
export function buildStubs() {
  return Object.fromEntries(
    SCREEN_NAMES.map((name) => [name, { name, props: ['document', 'backView', 'applyFilters'], template: `<div data-test="${name}" />` }]),
  )
}

export function buildWorkspace(refresh) {
  return {
    projects: ref([]),
    documentCount: ref(null),
    memoryCount: ref(null),
    trashCount: ref(3),
    documentTypeCounts: ref({}),
    memoryTypeCounts: ref({}),
    error: shallowRef(null),
    loadProjects: () => Promise.resolve([]),
    loadTrashCount: () => Promise.resolve(),
    loadCounts: () => Promise.resolve(),
    refresh,
  }
}
