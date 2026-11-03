import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { DocumentKind } from '@/api/enums'
import { buildDeletedDocument, buildDocument } from '@/components/__tests__/componentTestData'
import HomeView from '../HomeView.vue'
import { buildStubs, buildWorkspace } from './homeTestData'

const refresh = vi.fn().mockResolvedValue(undefined)
const workspace = buildWorkspace(refresh)

vi.mock('@/composables/useWorkspace', () => ({ useWorkspace: () => workspace }))

const screen = (wrapper, name) => wrapper.find(`[data-test="${name}"]`)
const navLink = (wrapper, text) => wrapper.findAll('nav a').find((link) => link.text().startsWith(text))
const overview = (wrapper) => wrapper.findComponent({ name: 'OverviewScreen' })
const detail = (wrapper) => wrapper.findComponent({ name: 'DocumentDetail' })
const editor = (wrapper) => wrapper.findComponent({ name: 'DocumentEditor' })

async function mountHome() {
  const wrapper = mount(HomeView, { global: { stubs: buildStubs() } })
  await flushPromises()
  return wrapper
}

/** Opens a document from the overview, the way a recent row does. */
async function openDocument(wrapper, document = buildDocument(), options) {
  overview(wrapper).vm.$emit('open', document, options)
  await flushPromises()
}

beforeEach(() => {
  window.scrollTo = vi.fn()
  Object.assign(workspace, buildWorkspace(refresh))
})

afterEach(() => vi.clearAllMocks())

describe('HomeView navigation', () => {
  it('starts on the overview', async () => {
    const wrapper = await mountHome()

    expect(screen(wrapper, 'OverviewScreen').exists()).toBe(true)
  })

  it('loads the workspace numbers once', async () => {
    await mountHome()

    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('follows a link in the header', async () => {
    const wrapper = await mountHome()

    await navLink(wrapper, 'Documents').trigger('click')

    expect(screen(wrapper, 'DocumentsScreen').exists()).toBe(true)
  })

  it('passes the filters a screen asked for to the list, then clears them', async () => {
    const wrapper = await mountHome()

    overview(wrapper).vm.$emit('go', 'documents', { filters: { kind: DocumentKind.MEMORY } })
    await flushPromises()
    const list = wrapper.findComponent({ name: 'DocumentsScreen' })

    expect(list.props('applyFilters')).toEqual({ kind: DocumentKind.MEMORY })
    list.vm.$emit('applied')
    await flushPromises()

    expect(list.props('applyFilters')).toBeNull()
  })
})

describe('HomeView opening a document', () => {
  it('shows the document that was opened', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)

    expect(detail(wrapper).props('document')).toMatchObject({ id: buildDocument().id, deleted: false })
  })

  it('remembers the screen it was opened from', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)

    expect(detail(wrapper).props('backView')).toBe('overview')
  })

  it('goes back to that screen', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)
    detail(wrapper).vm.$emit('back')
    await flushPromises()

    expect(screen(wrapper, 'OverviewScreen').exists()).toBe(true)
  })

  it('leaves the document once it is gone', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)
    detail(wrapper).vm.$emit('gone')
    await flushPromises()

    expect(screen(wrapper, 'OverviewScreen').exists()).toBe(true)
  })

  it('marks Trash in the header while a deleted document is open', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper, buildDeletedDocument(), { deleted: true })

    expect(navLink(wrapper, 'Trash').attributes('aria-current')).toBe('page')
    expect(detail(wrapper).props('backView')).toBe('trash')
  })

  it('refreshes the workspace numbers when a document changes', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)
    detail(wrapper).vm.$emit('changed')
    await flushPromises()

    expect(refresh).toHaveBeenCalledTimes(2)
  })
})

describe('HomeView editing', () => {
  it('opens an empty editor for a new document', async () => {
    const wrapper = await mountHome()

    await wrapper.findAll('header button').at(-1).trigger('click')

    expect(editor(wrapper).props('document')).toBeNull()
  })

  it('opens the editor on the document being edited', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)
    detail(wrapper).vm.$emit('edit', buildDocument())
    await flushPromises()

    expect(editor(wrapper).props('document')).toMatchObject({ id: buildDocument().id })
  })

  it('returns to the document when editing is cancelled', async () => {
    const wrapper = await mountHome()

    await openDocument(wrapper)
    detail(wrapper).vm.$emit('edit', buildDocument())
    await flushPromises()
    editor(wrapper).vm.$emit('cancel')
    await flushPromises()

    expect(screen(wrapper, 'DocumentDetail').exists()).toBe(true)
  })

  it('returns to the screen it was on when a new document is cancelled', async () => {
    const wrapper = await mountHome()

    await navLink(wrapper, 'Trash').trigger('click')
    await wrapper.findAll('header button').at(-1).trigger('click')
    editor(wrapper).vm.$emit('cancel')
    await flushPromises()

    expect(screen(wrapper, 'TrashScreen').exists()).toBe(true)
  })

  it('shows a saved document and counts it in the workspace', async () => {
    const wrapper = await mountHome()
    const saved = buildDocument({ id: 900 })

    await wrapper.findAll('header button').at(-1).trigger('click')
    editor(wrapper).vm.$emit('saved', saved)
    await flushPromises()

    expect(detail(wrapper).props('document')).toMatchObject({ id: 900, deleted: false })
    expect(refresh).toHaveBeenCalledWith({ force: true })
  })
})

describe('HomeView trash', () => {
  it('opens a deleted document from the trash screen', async () => {
    const wrapper = await mountHome()

    await navLink(wrapper, 'Trash').trigger('click')
    wrapper.findComponent({ name: 'TrashScreen' }).vm.$emit('open', buildDeletedDocument())
    await flushPromises()

    expect(detail(wrapper).props('document')).toMatchObject({ deleted: true })
  })

  it('refreshes the numbers when the trash changes', async () => {
    const wrapper = await mountHome()

    await navLink(wrapper, 'Trash').trigger('click')
    wrapper.findComponent({ name: 'TrashScreen' }).vm.$emit('changed')
    await flushPromises()

    expect(refresh).toHaveBeenCalledWith({ force: true })
  })
})
