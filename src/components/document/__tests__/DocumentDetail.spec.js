import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import {
  CONTENT,
  DOCUMENT_ID,
  DOCUMENT_NAME,
  ERROR_MESSAGE,
  RELATED_ID,
  RELATED_NAME,
  SUMMARY,
  buildApiError,
  buildDocument,
  textOf,
} from '@/components/__tests__/componentTestData'
import DocumentDetail from '../DocumentDetail.vue'
import { REFERRING_NAME, buildLinkedDocument, buildRelatedDocument, buildTrashedDocument } from './detailTestData'

const getDocument = vi.fn()
const getDeletedDocument = vi.fn()
const removeDocument = vi.fn()
const removeDocumentPermanently = vi.fn()
const removeDocumentRelation = vi.fn()
const restoreDocument = vi.fn()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  getDocument: (...args) => getDocument(...args),
  getDeletedDocument: (...args) => getDeletedDocument(...args),
  removeDocument: (...args) => removeDocument(...args),
  removeDocumentPermanently: (...args) => removeDocumentPermanently(...args),
  removeDocumentRelation: (...args) => removeDocumentRelation(...args),
  restoreDocument: (...args) => restoreDocument(...args),
  searchDocuments: vi.fn().mockResolvedValue({ content: [] }),
  createDocumentRelation: vi.fn(),
}))

const back = (wrapper) => wrapper.find('[data-test="back"]')
const banner = (wrapper) => wrapper.find('[data-test="banner"]')
const metaRows = (wrapper) => wrapper.findAll('[data-test="meta-row"]').map((row) => textOf(row))
const relationRows = (wrapper) => wrapper.findAll('[data-test="relation-row"]')
const buttonNamed = (wrapper, text) => wrapper.findAll('button').find((button) => button.text() === text)
const dialogButton = (text) =>
  [...document.querySelectorAll('[data-slot="dialog-content"] button')].find((button) => button.textContent.trim() === text)

async function mountDetail(props = {}) {
  const wrapper = mount(DocumentDetail, {
    props: { document: buildDocument(), backView: 'documents', ...props },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

/** Clicks an action that asks first, then confirms it in the dialog. */
async function confirmAction(wrapper, trigger, label) {
  await buttonNamed(wrapper, trigger).trigger('click')
  await flushPromises()
  dialogButton(label).click()
  await flushPromises()
}

beforeEach(() => {
  getDocument.mockResolvedValue(buildLinkedDocument())
  getDeletedDocument.mockResolvedValue(buildTrashedDocument())
  removeDocument.mockResolvedValue(undefined)
  removeDocumentPermanently.mockResolvedValue(undefined)
  removeDocumentRelation.mockResolvedValue(undefined)
  restoreDocument.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('DocumentDetail reading', () => {
  it('loads the whole document, content and all', async () => {
    await mountDetail()

    expect(getDocument).toHaveBeenCalledWith(DOCUMENT_ID, { includeContent: true })
  })

  it('shows the name, the summary and the content', async () => {
    const wrapper = await mountDetail()

    expect(wrapper.find('h1').text()).toBe(DOCUMENT_NAME)
    expect(textOf(wrapper)).toContain(SUMMARY)
    expect(textOf(wrapper)).toContain(CONTENT.split('\n')[0])
  })

  it('lists the metadata the API returned', async () => {
    const wrapper = await mountDetail()
    const rows = metaRows(wrapper)

    expect(rows).toContain(`ID${DOCUMENT_ID}`)
    expect(rows).toContain('KindDocument')
    expect(rows).toContain('ScopeProject')
    expect(rows).toContain('Agent writeAllowed')
  })

  it('names the memory type only for a memory', async () => {
    const wrapper = await mountDetail()

    expect(metaRows(wrapper).some((row) => row.startsWith('Memory type'))).toBe(false)
  })

  it('shows both relation groups', async () => {
    const wrapper = await mountDetail()

    expect(textOf(wrapper)).toContain(RELATED_NAME)
    expect(textOf(wrapper)).toContain(REFERRING_NAME)
  })

  it('says so when a group is empty', async () => {
    getDocument.mockResolvedValue(buildDocument())
    const wrapper = await mountDetail()

    expect(textOf(wrapper)).toContain('No outgoing relations.')
    expect(textOf(wrapper)).toContain('Not referenced by other documents.')
  })

  it('marks a document another one supersedes', async () => {
    const wrapper = await mountDetail()

    expect(textOf(wrapper)).toContain('Superseded')
  })

  it('explains a failed load and retries it', async () => {
    getDocument.mockRejectedValueOnce(buildApiError())
    const wrapper = await mountDetail()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)

    getDocument.mockResolvedValue(buildLinkedDocument())
    await buttonNamed(wrapper, 'Retry').trigger('click')
    await flushPromises()

    expect(textOf(wrapper)).toContain(CONTENT.split('\n')[0])
  })
})

describe('DocumentDetail navigation', () => {
  it('names the list it came from on the back button', async () => {
    const wrapper = await mountDetail({ backView: 'trash' })

    expect(back(wrapper).text()).toBe('← Trash')
  })

  it('leaves the screen when there is nothing to go back to', async () => {
    const wrapper = await mountDetail()

    await back(wrapper).trigger('click')

    expect(wrapper.emitted('back')).toHaveLength(1)
  })

  it('opens a related document in the same screen', async () => {
    const wrapper = await mountDetail()

    getDocument.mockResolvedValue(buildRelatedDocument())
    await relationRows(wrapper)[0].find('button').trigger('click')
    await flushPromises()

    expect(getDocument).toHaveBeenLastCalledWith(RELATED_ID, { includeContent: true })
    expect(wrapper.find('h1').text()).toBe(RELATED_NAME)
  })

  it('goes back to the document it came from, by name', async () => {
    const wrapper = await mountDetail()

    getDocument.mockResolvedValue(buildRelatedDocument())
    await relationRows(wrapper)[0].find('button').trigger('click')
    await flushPromises()

    expect(back(wrapper).text()).toBe(`← ${DOCUMENT_NAME}`)
    await back(wrapper).trigger('click')
    await flushPromises()

    expect(wrapper.find('h1').text()).toBe(DOCUMENT_NAME)
    expect(wrapper.emitted('back')).toBeUndefined()
  })

  it('hands the loaded document over for editing', async () => {
    const wrapper = await mountDetail()

    await buttonNamed(wrapper, 'Edit').trigger('click')

    expect(wrapper.emitted('edit')?.[0][0].id).toBe(DOCUMENT_ID)
  })
})

describe('DocumentDetail deleting', () => {
  it('asks before moving a document to trash', async () => {
    const wrapper = await mountDetail()

    await buttonNamed(wrapper, 'Move to trash').trigger('click')
    await flushPromises()

    expect(removeDocument).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('Relations are hidden while it is deleted')
  })

  it('moves the document to trash and leaves the screen', async () => {
    const wrapper = await mountDetail()

    await confirmAction(wrapper, 'Move to trash', 'Move to trash')

    expect(removeDocument).toHaveBeenCalledWith(DOCUMENT_ID)
    expect(wrapper.emitted('changed')).toHaveLength(1)
    expect(wrapper.emitted('gone')).toHaveLength(1)
  })

  it('keeps the screen and explains when the delete fails', async () => {
    removeDocument.mockRejectedValue(buildApiError())
    const wrapper = await mountDetail()

    await confirmAction(wrapper, 'Move to trash', 'Move to trash')

    expect(wrapper.emitted('gone')).toBeUndefined()
    expect(document.body.textContent).toContain(ERROR_MESSAGE)
  })

  it('removes an outgoing relation in the document’s own direction', async () => {
    const wrapper = await mountDetail()

    await relationRows(wrapper)[0].find('button[aria-label^="Remove"]').trigger('click')
    await flushPromises()
    dialogButton('Remove').click()
    await flushPromises()

    expect(removeDocumentRelation).toHaveBeenCalledWith(DOCUMENT_ID, RELATED_ID)
  })

  it('removes an incoming relation from the other document', async () => {
    const wrapper = await mountDetail()
    const referencedBy = wrapper.findAll('[data-test="relation-row"]').at(-1)

    await referencedBy.find('button[aria-label^="Remove"]').trigger('click')
    await flushPromises()
    dialogButton('Remove').click()
    await flushPromises()

    expect(removeDocumentRelation).toHaveBeenCalledWith(404, DOCUMENT_ID)
  })
})

describe('DocumentDetail in trash', () => {
  it('loads a deleted document from the trash endpoint', async () => {
    await mountDetail({ document: { ...buildTrashedDocument(), deleted: true }, backView: 'trash' })

    expect(getDeletedDocument).toHaveBeenCalledWith(DOCUMENT_ID, { includeContent: true })
    expect(getDocument).not.toHaveBeenCalled()
  })

  it('says since when it is in trash', async () => {
    const wrapper = await mountDetail({ document: { ...buildTrashedDocument(), deleted: true } })

    expect(textOf(banner(wrapper))).toContain('In trash since')
  })

  it('offers restore and permanent delete instead of editing', async () => {
    const wrapper = await mountDetail({ document: { ...buildTrashedDocument(), deleted: true } })

    expect(buttonNamed(wrapper, 'Restore')).toBeDefined()
    expect(buttonNamed(wrapper, 'Delete permanently')).toBeDefined()
    expect(buttonNamed(wrapper, 'Edit')).toBeUndefined()
    expect(buttonNamed(wrapper, 'Move to trash')).toBeUndefined()
  })

  it('cannot change relations of a deleted document', async () => {
    getDeletedDocument.mockResolvedValue(buildTrashedDocument({ relations: [{ id: RELATED_ID, name: RELATED_NAME, type: 'DEPENDS_ON' }] }))
    const wrapper = await mountDetail({ document: { ...buildTrashedDocument(), deleted: true } })

    expect(relationRows(wrapper)[0].find('button[aria-label^="Remove"]').exists()).toBe(false)
    expect(buttonNamed(wrapper, 'Add')).toBeUndefined()
  })

  it('restores the document and loads it again as a live one', async () => {
    const wrapper = await mountDetail({ document: { ...buildTrashedDocument(), deleted: true } })

    getDocument.mockResolvedValue(buildDocument())
    await buttonNamed(wrapper, 'Restore').trigger('click')
    await flushPromises()

    expect(restoreDocument).toHaveBeenCalledWith(DOCUMENT_ID)
    expect(wrapper.emitted('changed')).toHaveLength(1)
    expect(banner(wrapper).exists()).toBe(false)
  })

  it('deletes the document for good once that is confirmed', async () => {
    const wrapper = await mountDetail({ document: { ...buildTrashedDocument(), deleted: true } })

    await confirmAction(wrapper, 'Delete permanently', 'Delete permanently')

    expect(removeDocumentPermanently).toHaveBeenCalledWith(DOCUMENT_ID)
    expect(wrapper.emitted('gone')).toHaveLength(1)
  })
})
