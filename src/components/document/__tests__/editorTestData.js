import { ref, shallowRef } from 'vue'
import { buildProjects } from '@/components/__tests__/componentTestData'

export const NEW_SUMMARY = 'A short summary of the new document.'
export const NEW_CONTENT = 'The body of the new document.'

/** A stand-in for the shared workspace state; the editor only reads the project list. */
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
