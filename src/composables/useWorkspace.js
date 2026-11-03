import { ref, shallowRef } from 'vue'
import { DocumentKind, getDeletedDocuments, getProjectsInfo, getTypeCounts } from '@/api'

/**
 * Workspace-wide numbers the header and the overview need: the project keys with their
 * document counts, how many documents and memories there are, how many of each type, and
 * how many sit in trash. The state is shared by every caller.
 */
const projects = ref([])
const documentCount = ref(null)
const memoryCount = ref(null)
const trashCount = ref(null)
/** Live entries per document type, documents and memories counted apart. */
const documentTypeCounts = ref({})
const memoryTypeCounts = ref({})
const error = shallowRef(null)

let projectsLoaded = false

function sum(counts) {
  return counts.reduce((total, entry) => total + entry.count, 0)
}

/** Turns the `[{ type, count }]` the endpoint returns into counts keyed by type. */
function byType(counts) {
  return Object.fromEntries(counts.map((entry) => [entry.type, entry.count]))
}

async function loadProjects({ force = false } = {}) {
  if (projectsLoaded && !force) return projects.value
  const page = await getProjectsInfo({ size: 500, sort: 'projectKey,asc' })
  projects.value = page.content
  projectsLoaded = true
  return projects.value
}

async function loadTrashCount() {
  const page = await getDeletedDocuments({ page: 0, size: 1 })
  trashCount.value = page.totalElements ?? 0
}

/**
 * The counts endpoint reports entries per type, so asking for documents and for memories
 * separately gives both totals and the spread over types of each kind.
 */
async function loadCounts() {
  const [documents, memories] = await Promise.all([
    getTypeCounts({ kind: DocumentKind.DOCUMENT }),
    getTypeCounts({ kind: DocumentKind.MEMORY }),
  ])
  documentCount.value = sum(documents)
  memoryCount.value = sum(memories)
  documentTypeCounts.value = byType(documents)
  memoryTypeCounts.value = byType(memories)
}

/** Loads everything the header and the overview show; a failure is kept in `error`. */
async function refresh({ force = false } = {}) {
  error.value = null
  try {
    await Promise.all([loadProjects({ force }), loadCounts(), loadTrashCount()])
  } catch (e) {
    error.value = e
  }
}

export function useWorkspace() {
  return {
    projects,
    documentCount,
    memoryCount,
    trashCount,
    documentTypeCounts,
    memoryTypeCounts,
    error,
    loadProjects,
    loadTrashCount,
    loadCounts,
    refresh,
  }
}
