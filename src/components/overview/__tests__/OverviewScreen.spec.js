import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { DocumentKind, DocumentType, Scope } from '@/api/enums'
import {
  DOCUMENT_NAME,
  ERROR_MESSAGE,
  OTHER_PROJECT_KEY,
  PROJECT_KEY,
  buildApiError,
  buildDocument,
  buildMemory,
  buildPage,
  buildProjects,
  textOf,
} from '@/components/__tests__/componentTestData'
import OverviewScreen from '../OverviewScreen.vue'
import { buildWorkspace } from './overviewTestData'

const searchDocuments = vi.fn()
const workspace = buildWorkspace()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  searchDocuments: (...args) => searchDocuments(...args),
}))

vi.mock('@/composables/useWorkspace', () => ({ useWorkspace: () => workspace }))

const statTiles = (wrapper) => wrapper.findAll('[data-test="stats"] button')
const recentRows = (wrapper) => wrapper.findAll('[data-test="recent-row"]')

async function mountScreen() {
  const wrapper = mount(OverviewScreen)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  Object.assign(workspace, buildWorkspace())
  workspace.projects.value = buildProjects()
  workspace.documentCount.value = 9
  workspace.memoryCount.value = 193
  workspace.trashCount.value = 18
  workspace.documentTypeCounts.value = { [DocumentType.MARKDOWN]: 4, [DocumentType.JSON]: 5 }
  workspace.memoryTypeCounts.value = { [DocumentType.TEXT]: 190 }
  searchDocuments.mockResolvedValue(buildPage([buildDocument(), buildMemory({ id: 2, name: 'A decision' })]))
})

afterEach(() => vi.clearAllMocks())

describe('OverviewScreen headline numbers', () => {
  it('shows the four workspace counts', async () => {
    const wrapper = await mountScreen()

    expect(statTiles(wrapper).map((tile) => textOf(tile))).toEqual([
      'Documents9',
      'Memories193',
      'Projects2',
      'In trash18',
    ])
  })

  it('shows a dash for a count that is not loaded yet', async () => {
    workspace.documentCount.value = null
    const wrapper = await mountScreen()

    expect(textOf(statTiles(wrapper)[0])).toBe('Documents—')
  })

  it('opens the documents list filtered by the count that was clicked', async () => {
    const wrapper = await mountScreen()

    await statTiles(wrapper)[1].trigger('click')

    expect(wrapper.emitted('go')).toEqual([['documents', { filters: { kind: DocumentKind.MEMORY } }]])
  })

  it('opens the trash from the trash count', async () => {
    const wrapper = await mountScreen()

    await statTiles(wrapper)[3].trigger('click')

    expect(wrapper.emitted('go')).toEqual([['trash']])
  })

  it('filters by project scope from the projects count', async () => {
    const wrapper = await mountScreen()

    await statTiles(wrapper)[2].trigger('click')

    expect(wrapper.emitted('go')).toEqual([['documents', { filters: { scope: Scope.PROJECT } }]])
  })
})

describe('OverviewScreen recently updated', () => {
  it('asks for the newest entries of both kinds in one request', async () => {
    await mountScreen()

    expect(searchDocuments).toHaveBeenCalledTimes(1)
    expect(searchDocuments).toHaveBeenCalledWith({ includeSummary: true }, { page: 0, size: 6, sort: 'updatedAt,desc' })
  })

  it('lists what came back', async () => {
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain(DOCUMENT_NAME)
    expect(textOf(wrapper)).toContain('A decision')
  })

  it('opens the document that was clicked', async () => {
    const wrapper = await mountScreen()

    await recentRows(wrapper)[0].trigger('click')

    expect(wrapper.emitted('open')?.[0][0].id).toBe(buildDocument().id)
  })

  it('says so when there is nothing yet', async () => {
    searchDocuments.mockResolvedValue(buildPage([]))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('Nothing here yet.')
  })

  it('explains a failed load and offers to try again', async () => {
    searchDocuments.mockRejectedValueOnce(buildApiError())
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)

    searchDocuments.mockResolvedValue(buildPage([buildDocument()]))
    await wrapper.findAll('button').find((button) => button.text() === 'Retry').trigger('click')
    await flushPromises()

    expect(textOf(wrapper)).toContain(DOCUMENT_NAME)
  })

  it('goes to the whole list from the section heading', async () => {
    const wrapper = await mountScreen()

    await wrapper.findAll('button').find((button) => button.text().startsWith('All documents')).trigger('click')

    expect(wrapper.emitted('go')).toEqual([['documents']])
  })
})

describe('OverviewScreen projects and types', () => {
  it('lists every project with its document count', async () => {
    const wrapper = await mountScreen()
    const rows = wrapper.findAll('[data-test="projects"] button')

    expect(textOf(rows[0])).toBe(`${PROJECT_KEY}27`)
    expect(textOf(rows[1])).toBe(`${OTHER_PROJECT_KEY}4`)
  })

  it('filters the list by the project that was clicked', async () => {
    const wrapper = await mountScreen()

    await wrapper.findAll('[data-test="projects"] button')[0].trigger('click')

    expect(wrapper.emitted('go')).toEqual([['documents', { filters: { projectKey: PROJECT_KEY } }]])
  })

  it('says so when there are no projects', async () => {
    workspace.projects.value = []
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('No projects.')
  })

  it('counts documents and memories per type in tables of their own', async () => {
    const wrapper = await mountScreen()
    const tables = wrapper.findAll('[data-test="by-type"]')

    expect(textOf(tables[0])).toContain('Documents by type')
    expect(textOf(tables[0])).toContain('9')
    expect(textOf(tables[1])).toContain('Memories by type')
    expect(textOf(tables[1])).toContain('190')
  })

  it('shows every type, with zero for the ones that have no entries', async () => {
    const wrapper = await mountScreen()
    const rows = wrapper.findAll('[data-test="by-type"]')[0].findAll('[data-test="type-row"]')

    expect(rows).toHaveLength(Object.values(DocumentType).length)
    expect(textOf(rows[0])).toContain('0')
  })
})
