import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ERROR_MESSAGE, buildApiError } from '@/components/__tests__/componentTestData'
import ConfirmDialog from '../ConfirmDialog.vue'
import { CONFIRM_DESCRIPTION, CONFIRM_LABEL, CONFIRM_TITLE, buildConfirmProps } from './dialogTestData'

let mounted = null

afterEach(() => {
  mounted?.unmount()
  mounted = null
  document.body.innerHTML = ''
})

/** The dialog renders in a portal one tick later, so assertions read the document. */
async function mountDialog(props = {}) {
  mounted = mount(ConfirmDialog, { props: buildConfirmProps(props), attachTo: document.body })
  await flushPromises()
  const dialog = () => document.querySelector('[data-slot="dialog-content"]')
  return {
    wrapper: mounted,
    body: () => dialog()?.textContent ?? '',
    buttons: () => [...(dialog()?.querySelectorAll('button') ?? [])],
  }
}

describe('ConfirmDialog', () => {
  it('shows nothing while it is closed', async () => {
    await mountDialog({ open: false })

    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull()
  })

  it('shows the question, the explanation and the action', async () => {
    const { body, buttons } = await mountDialog()

    expect(body()).toContain(CONFIRM_TITLE)
    expect(body()).toContain(CONFIRM_DESCRIPTION)
    expect(buttons().map((button) => button.textContent.trim())).toEqual(['Cancel', CONFIRM_LABEL])
  })

  it('leaves out the explanation when there is none', async () => {
    const { body } = await mountDialog({ description: '' })

    expect(body()).not.toContain(CONFIRM_DESCRIPTION)
  })

  it('asks the caller to act only once the action is clicked', async () => {
    const { wrapper, buttons } = await mountDialog()

    expect(wrapper.emitted('confirm')).toBeUndefined()
    buttons()[1].click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
  })

  it('closes without acting when the cancel button is used', async () => {
    const { wrapper, buttons } = await mountDialog()

    buttons()[0].click()
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('names the action as the deleting one by default', async () => {
    const { buttons } = await mountDialog()

    expect(buttons()[1].dataset.variant).toBe('destructive')
  })

  it('says it is working and blocks both buttons while the action runs', async () => {
    const { buttons } = await mountDialog({ pending: true })

    expect(buttons()[1].textContent.trim()).toBe('Working…')
    expect(buttons().every((button) => button.disabled)).toBe(true)
  })

  it('shows why the action failed', async () => {
    const { body } = await mountDialog({ error: buildApiError() })

    expect(body()).toContain(ERROR_MESSAGE)
  })
})
