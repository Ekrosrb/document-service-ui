import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

vi.mock('@/composables/useWorkspace', () => ({
  useWorkspace: () => ({ trashCount: { value: null }, refresh: vi.fn(), loadTrashCount: vi.fn() }),
}))

describe('App', () => {
  it('opens on the workspace', () => {
    const wrapper = mount(App, { global: { stubs: { HomeView: { template: '<div data-test="home" />' } } } })

    expect(wrapper.find('[data-test="home"]').exists()).toBe(true)
  })
})
