import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import {
  DOCUMENT_ID,
  DOCUMENT_NAME,
  ERROR_MESSAGE,
  buildApiError,
  buildDeletedDocument,
  textOf,
} from '@/components/__tests__/componentTestData'
import TrashScreen from '../TrashScreen.vue'
import { DEFAULT_PAGEABLE, buildDeletedPage, buildDeletedRows } from './trashTestData'

const getDeletedDocuments = vi.fn()
const restoreDocument = vi.fn()
const removeDocumentPermanently = vi.fn()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  getDeletedDocuments: (...args) => getDeletedDocuments(...args),
  restoreDocument: (...args) => restoreDocument(...args),
  removeDocumentPermanently: (...args) => removeDocumentPermanently(...args),
}))

const rows = (wrapper) => wrapper.findAll('[data-test="trash-row"]')
const buttonNamed = (wrapper, text) => wrapper.findAll('button').find((button) => button.text() === text)
const dialogButton = (text) =>
  [...document.querySelectorAll('[data-slot="dialog-content"] button')].find((button) => button.textContent.trim() === text)

async function mountScreen() {
  const wrapper = mount(TrashScreen, { attachTo: document.body })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  getDeletedDocuments.mockResolvedValue(buildDeletedPage())
  restoreDocument.mockResolvedValue(undefined)
  removeDocumentPermanently.mockResolvedValue(undefined)
})

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('TrashScreen listing', () => {
  it('loads the deleted documents, newest first', async () => {
    await mountScreen()

    expect(getDeletedDocuments).toHaveBeenCalledWith(DEFAULT_PAGEABLE)
  })

  it('counts them in the heading', async () => {
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('2 deleted')
  })

  it('shows the name, summary, kind, scope and when it was deleted', async () => {
    const wrapper = await mountScreen()

    expect(textOf(rows(wrapper)[0])).toContain(DOCUMENT_NAME)
    expect(textOf(rows(wrapper)[0])).toContain('Document')
    expect(textOf(rows(wrapper)[0])).toContain('document-service-ui')
  })

  it('opens a deleted document', async () => {
    const wrapper = await mountScreen()

    await rows(wrapper)[0].find('button').trigger('click')

    expect(wrapper.emitted('open')?.[0][0].id).toBe(DOCUMENT_ID)
  })

  it('says when the trash is empty', async () => {
    getDeletedDocuments.mockResolvedValue(buildDeletedPage([]))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('Trash is empty.')
  })

  it('explains a failed load and retries it', async () => {
    getDeletedDocuments.mockRejectedValueOnce(buildApiError())
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)

    getDeletedDocuments.mockResolvedValue(buildDeletedPage())
    await buttonNamed(wrapper, 'Retry').trigger('click')
    await flushPromises()

    expect(rows(wrapper)).toHaveLength(2)
  })
})

describe('TrashScreen restoring and purging', () => {
  it('restores a document straight away and reloads the list', async () => {
    const wrapper = await mountScreen()

    await rows(wrapper)[0].findAll('button').at(-1).trigger('click')
    await flushPromises()

    expect(restoreDocument).toHaveBeenCalledWith(DOCUMENT_ID)
    expect(wrapper.emitted('changed')).toHaveLength(1)
    expect(getDeletedDocuments).toHaveBeenCalledTimes(2)
  })

  it('asks before deleting a document for good', async () => {
    const wrapper = await mountScreen()

    await rows(wrapper)[0].findAll('button')[1].trigger('click')
    await flushPromises()

    expect(removeDocumentPermanently).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('This cannot be undone.')
  })

  it('deletes it for good once that is confirmed', async () => {
    const wrapper = await mountScreen()

    await rows(wrapper)[0].findAll('button')[1].trigger('click')
    await flushPromises()
    dialogButton('Delete permanently').click()
    await flushPromises()

    expect(removeDocumentPermanently).toHaveBeenCalledWith(DOCUMENT_ID)
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('explains an action that failed', async () => {
    restoreDocument.mockRejectedValue(buildApiError())
    const wrapper = await mountScreen()

    await rows(wrapper)[0].findAll('button').at(-1).trigger('click')
    await flushPromises()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)
    expect(wrapper.emitted('changed')).toBeUndefined()
  })
})

describe('TrashScreen paging', () => {
  it('hides the arrows while everything fits on one page', async () => {
    const wrapper = await mountScreen()

    expect(wrapper.find('button[aria-label="Next page"]').exists()).toBe(false)
  })

  it('asks for the next page and says which rows are shown', async () => {
    getDeletedDocuments.mockResolvedValue(buildDeletedPage(buildDeletedRows(), { totalElements: 45, totalPages: 3 }))
    const wrapper = await mountScreen()

    expect(textOf(wrapper)).toContain('1–20 of 45 · page 1 of 3')
    await wrapper.find('button[aria-label="Next page"]').trigger('click')
    await flushPromises()

    expect(getDeletedDocuments).toHaveBeenLastCalledWith({ ...DEFAULT_PAGEABLE, page: 1 })
  })

  it('steps back a page when the last one empties out', async () => {
    getDeletedDocuments
      .mockResolvedValueOnce(buildDeletedPage(buildDeletedRows(), { totalElements: 21, totalPages: 2 }))
      .mockResolvedValueOnce(buildDeletedPage([], { totalElements: 20, totalPages: 1 }))
      .mockResolvedValue(buildDeletedPage(buildDeletedRows(), { totalElements: 20, totalPages: 1 }))
    const wrapper = await mountScreen()

    await wrapper.find('button[aria-label="Next page"]').trigger('click')
    await flushPromises()

    expect(getDeletedDocuments).toHaveBeenLastCalledWith({ ...DEFAULT_PAGEABLE, page: 0 })
    expect(rows(wrapper)).toHaveLength(2)
  })
})

describe('TrashScreen deleted documents', () => {
  it('keeps a document that was never named readable by its id', async () => {
    getDeletedDocuments.mockResolvedValue(buildDeletedPage([buildDeletedDocument({ name: '' })]))
    const wrapper = await mountScreen()

    expect(textOf(rows(wrapper)[0])).toContain(`Untitled #${DOCUMENT_ID}`)
  })
})
