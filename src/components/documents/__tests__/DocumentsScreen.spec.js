import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { Author, DocumentKind, MemoryType, Scope } from '@/api/enums'
import {
  DOCUMENT_NAME,
  ERROR_MESSAGE,
  PROJECT_KEY,
  SUMMARY,
  buildApiError,
  buildDocument,
  textOf,
} from '@/components/__tests__/componentTestData'
import DocumentsScreen from '../DocumentsScreen.vue'
import {
  DEFAULT_PAGEABLE,
  PAGE_SIZE,
  SEARCH_TEXT,
  UNFILTERED_REQUEST,
  buildResultPage,
  buildResults,
  buildSupersededDocument,
  buildWorkspace,
} from './documentsTestData'

const searchDocuments = vi.fn()
const workspace = buildWorkspace()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  searchDocuments: (...args) => searchDocuments(...args),
}))

vi.mock('@/composables/useWorkspace', () => ({ useWorkspace: () => workspace }))

const rows = (wrapper) => wrapper.findAll('[data-test="row"]')
const select = (wrapper, field) => wrapper.find(`#filter-${field}`)
const kindRadios = (wrapper) => wrapper.findAll('input[type="radio"]')
const supersededBox = (wrapper) => wrapper.find('input[type="checkbox"]')
const pageLabel = (wrapper) => wrapper.find('[data-test="page-label"]').text()
const buttonNamed = (wrapper, text) => wrapper.findAll('button').find((button) => button.text() === text)
const lastRequest = () => searchDocuments.mock.calls.at(-1)

async function mountScreen(props = {}) {
  const wrapper = mount(DocumentsScreen, { props })
  await flushPromises()
  return wrapper
}

/** Types a query and lets the debounce and the request settle. */
async function typeQuery(wrapper, text = SEARCH_TEXT) {
  await wrapper.find('input[type="text"], input:not([type])').setValue(text)
  await vi.advanceTimersByTimeAsync(400)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers()
  Object.assign(workspace, buildWorkspace())
  searchDocuments.mockResolvedValue(buildResultPage())
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('DocumentsScreen listing', () => {
  it('lists everything when nothing is filtered', async () => {
    const wrapper = await mountScreen()

    expect(searchDocuments).toHaveBeenCalledWith(UNFILTERED_REQUEST, DEFAULT_PAGEABLE)
    expect(rows(wrapper)).toHaveLength(2)
  })

  it('shows the name, the summary and the project of a result', async () => {
    const wrapper = await mountScreen()

    expect(textOf(rows(wrapper)[0])).toContain(DOCUMENT_NAME)
    expect(textOf(rows(wrapper)[0])).toContain(SUMMARY)
    expect(textOf(rows(wrapper)[0])).toContain(PROJECT_KEY)
  })

  it('labels a memory with its memory type and a document with "Document"', async () => {
    const wrapper = await mountScreen()

    expect(textOf(rows(wrapper)[0])).toContain('Document')
    expect(textOf(rows(wrapper)[1])).toContain('Decision')
  })

  it('counts the results in the heading', async () => {
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('2 results')
  })

  it('says it in the singular for one result', async () => {
    searchDocuments.mockResolvedValue(buildResultPage([buildDocument()]))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('1 result')
  })

  it('opens the document that was clicked', async () => {
    const wrapper = await mountScreen()

    await rows(wrapper)[0].trigger('click')

    expect(wrapper.emitted('open')?.[0][0].id).toBe(buildDocument().id)
  })

  it('marks a result another document supersedes', async () => {
    searchDocuments.mockResolvedValue(buildResultPage([buildSupersededDocument(), buildDocument()]))
    const wrapper = await mountScreen()

    expect(textOf(rows(wrapper)[0])).toContain('Superseded')
    expect(textOf(rows(wrapper)[1])).not.toContain('Superseded')
  })
})

describe('DocumentsScreen filters', () => {
  it('searches on the query once the typing stops', async () => {
    const wrapper = await mountScreen()

    await typeQuery(wrapper)

    expect(lastRequest()[0]).toMatchObject({ query: SEARCH_TEXT })
  })

  it('filters by kind', async () => {
    const wrapper = await mountScreen()

    await kindRadios(wrapper)[2].setValue()
    await flushPromises()

    expect(lastRequest()[0]).toMatchObject({ kind: DocumentKind.MEMORY })
  })

  it('filters by scope, author and project', async () => {
    const wrapper = await mountScreen()

    await select(wrapper, 'scope').setValue(Scope.GLOBAL)
    await flushPromises()
    await select(wrapper, 'author').setValue(Author.AGENT)
    await flushPromises()
    await select(wrapper, 'projectKey').setValue(PROJECT_KEY)
    await flushPromises()

    expect(lastRequest()[0]).toMatchObject({ scope: Scope.GLOBAL, author: Author.AGENT, projectKey: PROJECT_KEY })
  })

  it('offers every project the workspace knows', async () => {
    const wrapper = await mountScreen()

    expect(select(wrapper, 'projectKey').findAll('option').map((option) => option.text())).toEqual([
      'All projects',
      PROJECT_KEY,
      'payments-api',
    ])
  })

  it('hides the memory type filter for documents and forgets what it held', async () => {
    const wrapper = await mountScreen()

    await select(wrapper, 'memoryType').setValue(MemoryType.RULE)
    await flushPromises()
    await kindRadios(wrapper)[1].setValue()
    await flushPromises()

    expect(select(wrapper, 'memoryType').exists()).toBe(false)
    expect(lastRequest()[0].memoryType).toBeUndefined()
  })

  it('asks for relations only once superseded entries can appear', async () => {
    const wrapper = await mountScreen()

    await supersededBox(wrapper).setValue(true)
    await flushPromises()

    expect(lastRequest()[0]).toMatchObject({ includeSuperseded: true, includeRelations: true })
  })

  it('offers to clear the filters only once one is set', async () => {
    const wrapper = await mountScreen()

    expect(buttonNamed(wrapper, 'Clear filters')).toBeUndefined()
    await select(wrapper, 'scope').setValue(Scope.AGENT)
    await flushPromises()

    expect(buttonNamed(wrapper, 'Clear filters')).toBeDefined()
  })

  it('goes back to listing everything when the filters are cleared', async () => {
    const wrapper = await mountScreen()

    await select(wrapper, 'scope').setValue(Scope.AGENT)
    await flushPromises()
    await buttonNamed(wrapper, 'Clear filters').trigger('click')
    await flushPromises()

    expect(lastRequest()[0]).toEqual(UNFILTERED_REQUEST)
  })

  it('applies the filters another screen asked for, once', async () => {
    const wrapper = await mountScreen({ applyFilters: { kind: DocumentKind.MEMORY } })

    expect(lastRequest()[0]).toMatchObject({ kind: DocumentKind.MEMORY })
    expect(wrapper.emitted('applied')).toHaveLength(1)
    expect(searchDocuments).toHaveBeenCalledTimes(1)
  })

  it('replaces the filters when another screen asks again', async () => {
    const wrapper = await mountScreen()

    await wrapper.setProps({ applyFilters: { projectKey: PROJECT_KEY } })
    await flushPromises()

    expect(lastRequest()[0]).toMatchObject({ projectKey: PROJECT_KEY })
  })
})

describe('DocumentsScreen paging', () => {
  it('says which results are shown', async () => {
    searchDocuments.mockResolvedValue(buildResultPage(buildResults(), { totalElements: 45, totalPages: 3, last: false }))
    const wrapper = await mountScreen()

    expect(pageLabel(wrapper)).toBe('1–20 of 45 · page 1 of 3')
  })

  it('says there is nothing when the search is empty', async () => {
    searchDocuments.mockResolvedValue(buildResultPage([]))
    const wrapper = await mountScreen()

    expect(pageLabel(wrapper)).toBe('0 results')
  })

  it('asks for the next page and counts it in the label', async () => {
    searchDocuments.mockResolvedValue(buildResultPage(buildResults(), { totalElements: 45, totalPages: 3, last: false }))
    const wrapper = await mountScreen()

    await wrapper.find('button[aria-label="Next page"]').trigger('click')
    await flushPromises()

    expect(lastRequest()[1]).toEqual({ ...DEFAULT_PAGEABLE, page: 1 })
    expect(pageLabel(wrapper)).toBe(`21–40 of 45 · page 2 of 3`)
  })

  it('blocks the arrows at the ends of the list', async () => {
    searchDocuments.mockResolvedValue(buildResultPage(buildResults(), { totalElements: 45, totalPages: 3, last: false }))
    const wrapper = await mountScreen()

    expect(wrapper.find('button[aria-label="Previous page"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[aria-label="Next page"]').attributes('disabled')).toBeUndefined()
  })

  it('starts again at the first page when a filter changes', async () => {
    searchDocuments.mockResolvedValue(buildResultPage(buildResults(), { totalElements: 45, totalPages: 3, last: false }))
    const wrapper = await mountScreen()

    await wrapper.find('button[aria-label="Next page"]').trigger('click')
    await flushPromises()
    await select(wrapper, 'scope').setValue(Scope.GLOBAL)
    await flushPromises()

    expect(lastRequest()[1]).toEqual({ ...DEFAULT_PAGEABLE, page: 0 })
  })
})

describe('DocumentsScreen empty and failed searches', () => {
  it('offers to clear the filters when nothing matches them', async () => {
    searchDocuments.mockResolvedValue(buildResultPage([]))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('No documents match these filters.')
    expect(buttonNamed(wrapper, 'Clear filters')).toBeDefined()
  })

  it('explains a failed search, field by field, and retries it', async () => {
    searchDocuments.mockRejectedValueOnce(buildApiError(ERROR_MESSAGE, { memoryType: 'Only with kind MEMORY' }))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)
    expect(textOf(wrapper)).toContain('memoryType: Only with kind MEMORY')

    searchDocuments.mockResolvedValue(buildResultPage())
    await buttonNamed(wrapper, 'Retry').trigger('click')
    await flushPromises()

    expect(rows(wrapper)).toHaveLength(2)
  })

  it('shows nothing from the failed search', async () => {
    searchDocuments.mockRejectedValue(buildApiError())
    const wrapper = await mountScreen()

    expect(rows(wrapper)).toHaveLength(0)
  })
})

describe('DocumentsScreen page size', () => {
  it('asks for one page of results at a time', async () => {
    await mountScreen()

    expect(lastRequest()[1].size).toBe(PAGE_SIZE)
  })
})
