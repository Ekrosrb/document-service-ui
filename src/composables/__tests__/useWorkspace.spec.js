import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentKind, DocumentType } from '@/api/enums'
import {
  OTHER_PROJECT_KEY,
  PROJECT_KEY,
  TRASH_TOTAL,
  buildDeletedPage,
  buildDocumentTypeCounts,
  buildMemoryTypeCounts,
  buildProjectsPage,
} from './workspaceTestData'

const getProjectsInfo = vi.fn()
const getTypeCounts = vi.fn()
const getDeletedDocuments = vi.fn()

vi.mock('@/api', () => ({
  DocumentKind: { DOCUMENT: 'DOCUMENT', MEMORY: 'MEMORY' },
  getProjectsInfo: (...args) => getProjectsInfo(...args),
  getTypeCounts: (...args) => getTypeCounts(...args),
  getDeletedDocuments: (...args) => getDeletedDocuments(...args),
}))

/** The state is a module singleton, so every test starts from a fresh import. */
async function loadWorkspace() {
  vi.resetModules()
  const { useWorkspace } = await import('../useWorkspace')
  return useWorkspace()
}

beforeEach(() => {
  getProjectsInfo.mockResolvedValue(buildProjectsPage())
  getTypeCounts.mockImplementation(({ kind } = {}) =>
    Promise.resolve(kind === DocumentKind.DOCUMENT ? buildDocumentTypeCounts() : buildMemoryTypeCounts()),
  )
  getDeletedDocuments.mockResolvedValue(buildDeletedPage())
})

afterEach(() => vi.clearAllMocks())

describe('loadProjects', () => {
  it('keeps the project keys with their counts', async () => {
    const { projects, loadProjects } = await loadWorkspace()

    await loadProjects()

    expect(projects.value.map((project) => project.projectKey)).toEqual([PROJECT_KEY, OTHER_PROJECT_KEY])
  })

  it('asks the API once and serves later calls from memory', async () => {
    const { loadProjects } = await loadWorkspace()

    await loadProjects()
    await loadProjects()

    expect(getProjectsInfo).toHaveBeenCalledTimes(1)
  })

  it('asks again when the caller forces a reload', async () => {
    const { loadProjects } = await loadWorkspace()

    await loadProjects()
    await loadProjects({ force: true })

    expect(getProjectsInfo).toHaveBeenCalledTimes(2)
  })
})

describe('loadCounts', () => {
  it('sums each kind into its own total', async () => {
    const { documentCount, memoryCount, loadCounts } = await loadWorkspace()

    await loadCounts()

    expect(documentCount.value).toBe(4)
    expect(memoryCount.value).toBe(192)
  })

  it('keeps the per-type counts of the two kinds apart', async () => {
    const { documentTypeCounts, memoryTypeCounts, loadCounts } = await loadWorkspace()

    await loadCounts()

    expect(documentTypeCounts.value).toEqual({ [DocumentType.MARKDOWN]: 3, [DocumentType.JSON]: 1 })
    expect(memoryTypeCounts.value).toEqual({ [DocumentType.TEXT]: 190, [DocumentType.MARKDOWN]: 2 })
  })

  it('counts documents and memories in separate requests', async () => {
    const { loadCounts } = await loadWorkspace()

    await loadCounts()

    expect(getTypeCounts).toHaveBeenCalledWith({ kind: DocumentKind.DOCUMENT })
    expect(getTypeCounts).toHaveBeenCalledWith({ kind: DocumentKind.MEMORY })
  })
})

describe('loadTrashCount', () => {
  it('reads the number of deleted documents from the page total', async () => {
    const { trashCount, loadTrashCount } = await loadWorkspace()

    await loadTrashCount()

    expect(trashCount.value).toBe(TRASH_TOTAL)
    expect(getDeletedDocuments).toHaveBeenCalledWith({ page: 0, size: 1 })
  })

  it('counts nothing when the page has no total', async () => {
    getDeletedDocuments.mockResolvedValue({ content: [] })
    const { trashCount, loadTrashCount } = await loadWorkspace()

    await loadTrashCount()

    expect(trashCount.value).toBe(0)
  })
})

describe('refresh', () => {
  it('loads the projects, the counts and the trash count together', async () => {
    const { projects, documentCount, trashCount, refresh } = await loadWorkspace()

    await refresh()

    expect(projects.value).toHaveLength(2)
    expect(documentCount.value).toBe(4)
    expect(trashCount.value).toBe(TRASH_TOTAL)
  })

  it('keeps a failure instead of throwing it', async () => {
    const failure = new Error('service down')
    getTypeCounts.mockRejectedValue(failure)
    const { error, refresh } = await loadWorkspace()

    await refresh()

    expect(error.value).toBe(failure)
  })

  it('clears an earlier failure once a reload works', async () => {
    getTypeCounts.mockRejectedValueOnce(new Error('service down'))
    const { error, refresh } = await loadWorkspace()

    await refresh()
    await refresh({ force: true })

    expect(error.value).toBeNull()
  })
})
