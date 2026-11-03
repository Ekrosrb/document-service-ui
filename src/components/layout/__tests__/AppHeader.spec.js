import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '../AppHeader.vue'
import { LINKS, buildProps } from './headerTestData'

const links = (wrapper) => wrapper.findAll('nav a')
const themeButton = (wrapper) => wrapper.findAll('button')[0]

describe('AppHeader', () => {
  it('shows the three places to go', () => {
    const wrapper = mount(AppHeader, { props: buildProps() })

    expect(links(wrapper).map((link) => link.text())).toEqual(['Overview', 'Documents', 'Trash (0)'])
  })

  it('counts the documents in trash next to the link', () => {
    const wrapper = mount(AppHeader, { props: buildProps({ trashCount: 18 }) })

    expect(links(wrapper)[2].text()).toBe('Trash (18)')
  })

  it('leaves the count out until it is known', () => {
    const wrapper = mount(AppHeader, { props: buildProps({ trashCount: null }) })

    expect(links(wrapper)[2].text()).toBe('Trash')
  })

  it.each(LINKS)('marks %s as the current place', (view, index) => {
    const wrapper = mount(AppHeader, { props: buildProps({ view }) })

    expect(links(wrapper)[index].attributes('aria-current')).toBe('page')
  })

  it('keeps Documents marked while a document is open or edited', () => {
    expect(links(mount(AppHeader, { props: buildProps({ view: 'detail' }) }))[1].attributes('aria-current')).toBe('page')
    expect(links(mount(AppHeader, { props: buildProps({ view: 'edit' }) }))[1].attributes('aria-current')).toBe('page')
  })

  it('asks to go somewhere when a link is used', async () => {
    const wrapper = mount(AppHeader, { props: buildProps() })

    await links(wrapper)[2].trigger('click')

    expect(wrapper.emitted('go')).toEqual([['trash']])
  })

  it('asks for a new document', async () => {
    const wrapper = mount(AppHeader, { props: buildProps() })
    const create = wrapper.findAll('button').at(-1)

    await create.trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('offers the other theme, saying which it would switch to', async () => {
    const wrapper = mount(AppHeader, { props: buildProps() })
    const label = themeButton(wrapper).attributes('aria-label')

    expect(label).toMatch(/Switch to (light|dark) theme/)
    await themeButton(wrapper).trigger('click')

    expect(themeButton(wrapper).attributes('aria-label')).not.toBe(label)
  })
})
