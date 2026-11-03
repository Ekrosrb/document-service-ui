import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { Author, DocumentKind, DocumentType, MemoryType, Scope } from '@/api/enums'
import {
  DOCUMENT_ID,
  ERROR_MESSAGE,
  PROJECT_KEY,
  buildApiError,
  buildDocument,
  buildMemory,
  textOf,
} from '@/components/__tests__/componentTestData'
import DocumentEditor from '../DocumentEditor.vue'
import { NEW_CONTENT, NEW_SUMMARY, buildWorkspace } from './editorTestData'

const createDocument = vi.fn()
const updateDocument = vi.fn()
const getDocument = vi.fn()
const workspace = buildWorkspace()

vi.mock('@/api', async () => ({
  ...(await vi.importActual('@/api/enums')),
  createDocument: (...args) => createDocument(...args),
  updateDocument: (...args) => updateDocument(...args),
  getDocument: (...args) => getDocument(...args),
}))

vi.mock('@/composables/useWorkspace', () => ({ useWorkspace: () => workspace }))

const field = (wrapper, id) => wrapper.find(`#editor-${id}`)
const segment = (wrapper, name) => wrapper.findAll(`input[name="${name}"]`)
const buttonNamed = (wrapper, text) => wrapper.findAll('button').find((button) => button.text() === text)
const save = (wrapper) => wrapper.findAll('button').find((button) => /Create|Save changes/.test(button.text()))

async function mountEditor(props = {}) {
  const wrapper = mount(DocumentEditor, { props })
  await flushPromises()
  return wrapper
}

/** Fills the fields a new document cannot be created without. */
async function fillDraft(wrapper, { scope = Scope.GLOBAL } = {}) {
  await segment(wrapper, 'draft-kind')[0].setValue()
  await segment(wrapper, 'draft-scope')[Object.values(Scope).indexOf(scope)].setValue()
  await field(wrapper, 'summary').setValue(NEW_SUMMARY)
  await field(wrapper, 'content').setValue(NEW_CONTENT)
}

beforeEach(() => {
  Object.assign(workspace, buildWorkspace())
  createDocument.mockResolvedValue({ id: 900 })
  updateDocument.mockResolvedValue(undefined)
  getDocument.mockResolvedValue(buildDocument({ id: 900 }))
})

afterEach(() => vi.clearAllMocks())

describe('DocumentEditor creating', () => {
  it('opens an empty draft', async () => {
    const wrapper = await mountEditor()

    expect(wrapper.find('h1').text()).toBe('Create document')
    expect(save(wrapper).text()).toBe('Create')
  })

  it('lets the kind, scope and author be chosen', async () => {
    const wrapper = await mountEditor()

    expect(segment(wrapper, 'draft-kind')).toHaveLength(Object.values(DocumentKind).length)
    expect(segment(wrapper, 'draft-scope')).toHaveLength(Object.values(Scope).length)
    expect(segment(wrapper, 'draft-author')).toHaveLength(Object.values(Author).length)
  })

  it('names every field the server requires before it is sent', async () => {
    const wrapper = await mountEditor()

    await save(wrapper).trigger('click')
    await flushPromises()

    expect(createDocument).not.toHaveBeenCalled()
    expect(textOf(wrapper)).toContain('Required.')
  })

  it('asks for a project key only for project scope', async () => {
    const wrapper = await mountEditor()

    expect(field(wrapper, 'projectKey').exists()).toBe(false)
    await segment(wrapper, 'draft-scope')[Object.values(Scope).indexOf(Scope.PROJECT)].setValue()

    expect(field(wrapper, 'projectKey').exists()).toBe(true)
  })

  it('refuses a project-scoped draft with no project key', async () => {
    const wrapper = await mountEditor()

    await fillDraft(wrapper, { scope: Scope.PROJECT })
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(createDocument).not.toHaveBeenCalled()
    expect(textOf(wrapper)).toContain('Project key must be specified')
  })

  it('offers the known project keys to pick from', async () => {
    const wrapper = await mountEditor()

    await segment(wrapper, 'draft-scope')[Object.values(Scope).indexOf(Scope.PROJECT)].setValue()

    expect(wrapper.findAll('#editor-project-keys option').map((option) => option.attributes('value'))).toContain(PROJECT_KEY)
  })

  it('asks for a memory type only for a memory', async () => {
    const wrapper = await mountEditor()

    expect(field(wrapper, 'memoryType').exists()).toBe(false)
    await segment(wrapper, 'draft-kind')[Object.values(DocumentKind).indexOf(DocumentKind.MEMORY)].setValue()

    expect(field(wrapper, 'memoryType').exists()).toBe(true)
  })

  it('asks for a custom extension only for the custom type, and insists on it', async () => {
    const wrapper = await mountEditor()

    expect(field(wrapper, 'customExtension').exists()).toBe(false)
    await fillDraft(wrapper)
    await field(wrapper, 'type').setValue(DocumentType.CUSTOM)
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(createDocument).not.toHaveBeenCalled()
    expect(textOf(wrapper)).toContain('Custom extension is required')
  })

  it('counts the summary against its limit', async () => {
    const wrapper = await mountEditor()

    await field(wrapper, 'summary').setValue('abc')

    expect(textOf(wrapper)).toContain('3 / 1024')
  })

  it('names the file after the document and its type', async () => {
    const wrapper = await mountEditor()

    await field(wrapper, 'name').setValue('Refund flow design')
    await field(wrapper, 'type').setValue(DocumentType.MARKDOWN)

    expect(textOf(wrapper)).toContain('refund-flow-design.md')
  })

  it('creates the document and hands back the saved one', async () => {
    const wrapper = await mountEditor()

    await fillDraft(wrapper)
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ kind: DocumentKind.DOCUMENT, scope: Scope.GLOBAL, summary: NEW_SUMMARY, content: NEW_CONTENT }),
    )
    expect(getDocument).toHaveBeenCalledWith(900, { includeContent: true })
    expect(wrapper.emitted('saved')?.[0][0].id).toBe(900)
  })

  it('explains a refused create and stays open', async () => {
    createDocument.mockRejectedValue(buildApiError())
    const wrapper = await mountEditor()

    await fillDraft(wrapper)
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(textOf(wrapper)).toContain(ERROR_MESSAGE)
    expect(wrapper.emitted('saved')).toBeUndefined()
  })

  it('leaves the editor when it is cancelled', async () => {
    const wrapper = await mountEditor()

    await buttonNamed(wrapper, 'Cancel').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('DocumentEditor editing', () => {
  const existing = () => buildMemory({ memoryType: MemoryType.DECISION })

  it('opens on the document it was given', async () => {
    const wrapper = await mountEditor({ document: existing() })

    expect(wrapper.find('h1').text()).toBe(existing().name)
    expect(textOf(wrapper)).toContain(`Edit · #${DOCUMENT_ID}`)
    expect(save(wrapper).text()).toBe('Save changes')
  })

  it('shows kind, scope and author as settled, not as choices', async () => {
    const wrapper = await mountEditor({ document: existing() })

    expect(segment(wrapper, 'draft-kind')).toHaveLength(0)
    expect(textOf(wrapper)).toContain('Kind, scope and author are set at creation.')
    expect(textOf(wrapper)).toContain('Memory')
  })

  it('sends only the fields that changed', async () => {
    const document = existing()
    const wrapper = await mountEditor({ document })

    await field(wrapper, 'name').setValue('A new name')
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(updateDocument).toHaveBeenCalledWith(DOCUMENT_ID, { name: 'A new name' })
  })

  it('saves nothing when nothing changed, and still shows the document', async () => {
    const wrapper = await mountEditor({ document: existing() })

    await save(wrapper).trigger('click')
    await flushPromises()

    expect(updateDocument).not.toHaveBeenCalled()
    expect(wrapper.emitted('saved')).toHaveLength(1)
  })

  it('refuses a summary longer than the server allows', async () => {
    const wrapper = await mountEditor({ document: existing() })

    await field(wrapper, 'summary').setValue('x'.repeat(1025))
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(updateDocument).not.toHaveBeenCalled()
    expect(textOf(wrapper)).toContain('At most 1024 characters.')
  })

  it('insists on a project key the document can no longer do without', async () => {
    const wrapper = await mountEditor({ document: buildDocument({ scope: Scope.PROJECT }) })

    await field(wrapper, 'projectKey').setValue('')
    await save(wrapper).trigger('click')
    await flushPromises()

    expect(updateDocument).not.toHaveBeenCalled()
    expect(textOf(wrapper)).toContain('Project key must be specified')
  })
})
