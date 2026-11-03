import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { RelationType } from '@/api/enums'
import { DOCUMENT_ID, ERROR_MESSAGE, buildApiError, buildDocument, buildPage, buildRelation } from '@/components/__tests__/componentTestData'
import RelationDialog from '../RelationDialog.vue'
import { CANDIDATE_NAME, SEARCH_TEXT, buildCandidates } from './dialogTestData'

const searchDocuments = vi.fn()
const createDocumentRelation = vi.fn()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  searchDocuments: (...args) => searchDocuments(...args),
  createDocumentRelation: (...args) => createDocumentRelation(...args),
}))

let mounted = null

const dialog = () => document.querySelector('[data-slot="dialog-content"]')
const candidates = () => [...(dialog()?.querySelectorAll('button[aria-pressed]') ?? [])]
const addButton = () => [...dialog().querySelectorAll('button')].find((button) => button.textContent.trim().startsWith('Add'))

async function mountDialog(props = {}) {
  mounted = mount(RelationDialog, {
    props: { open: true, document: buildDocument(), ...props },
    attachTo: document.body,
  })
  await flushPromises()
  return mounted
}

/** Types into the search field and lets the debounce and the request settle. */
async function search(text = SEARCH_TEXT) {
  const field = dialog().querySelector('#relation-search')
  field.value = text
  field.dispatchEvent(new Event('input'))
  await vi.advanceTimersByTimeAsync(400)
  await flushPromises()
}

beforeEach(() => {
  vi.useFakeTimers()
  searchDocuments.mockResolvedValue(buildPage(buildCandidates()))
  createDocumentRelation.mockResolvedValue(undefined)
})

afterEach(() => {
  mounted?.unmount()
  mounted = null
  document.body.innerHTML = ''
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('RelationDialog', () => {
  it('shows nothing while it is closed', async () => {
    await mountDialog({ open: false })

    expect(dialog()).toBeNull()
  })

  it('names the document the relation starts from', async () => {
    await mountDialog()

    expect(dialog().textContent).toContain('Service overview')
  })

  it('offers every relation type, starting at "related to"', async () => {
    await mountDialog()
    const select = dialog().querySelector('#relation-type')

    expect([...select.options].map((option) => option.value)).toEqual(Object.values(RelationType))
    expect(select.value).toBe(RelationType.RELATED_TO)
  })

  it('asks for a search before it looks anything up', async () => {
    await mountDialog()

    expect(dialog().textContent).toContain('Type to find a document.')
    expect(searchDocuments).not.toHaveBeenCalled()
  })

  it('searches once the typing stops', async () => {
    await mountDialog()

    await search()

    expect(searchDocuments).toHaveBeenCalledWith({ query: SEARCH_TEXT, includeSummary: true }, expect.anything())
    expect(dialog().textContent).toContain(CANDIDATE_NAME)
  })

  it('leaves out the document itself and the ones already linked', async () => {
    const [first, second] = buildCandidates()
    searchDocuments.mockResolvedValue(buildPage([buildDocument({ id: DOCUMENT_ID }), first, second]))
    await mountDialog({ document: buildDocument({ relations: [buildRelation({ id: second.id })] }) })

    await search()

    expect(candidates()).toHaveLength(1)
    expect(candidates()[0].textContent).toContain(CANDIDATE_NAME)
  })

  it('says so when the search finds nothing', async () => {
    searchDocuments.mockResolvedValue(buildPage([]))
    await mountDialog()

    await search()

    expect(dialog().textContent).toContain('Nothing found.')
  })

  it('cannot add a relation before a document is picked', async () => {
    await mountDialog()
    await search()

    expect(addButton().disabled).toBe(true)
  })

  it('links the picked document with the chosen type', async () => {
    const wrapper = await mountDialog()
    await search()

    candidates()[0].click()
    await flushPromises()
    addButton().click()
    await flushPromises()

    expect(createDocumentRelation).toHaveBeenCalledWith({
      documentId: DOCUMENT_ID,
      relatedDocumentId: 6,
      type: RelationType.RELATED_TO,
    })
    expect(wrapper.emitted('added')).toHaveLength(1)
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('keeps the dialog open and explains a failed link', async () => {
    createDocumentRelation.mockRejectedValue(buildApiError())
    const wrapper = await mountDialog()
    await search()

    candidates()[0].click()
    await flushPromises()
    addButton().click()
    await flushPromises()

    expect(dialog().textContent).toContain(ERROR_MESSAGE)
    expect(wrapper.emitted('added')).toBeUndefined()
  })

  it('starts from a clean form when it is opened again', async () => {
    const wrapper = await mountDialog({ open: false })

    await wrapper.setProps({ open: true })
    await flushPromises()
    await search()
    candidates()[0].click()
    await wrapper.setProps({ open: false })
    await wrapper.setProps({ open: true })
    await flushPromises()

    expect(dialog().textContent).toContain('Type to find a document.')
    expect(addButton().disabled).toBe(true)
  })
})
