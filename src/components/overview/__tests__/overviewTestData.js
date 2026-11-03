import { ref, shallowRef } from 'vue'

/** A stand-in for the shared workspace state, so each test sets its own numbers. */
export function buildWorkspace() {
  return {
    projects: ref([]),
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
