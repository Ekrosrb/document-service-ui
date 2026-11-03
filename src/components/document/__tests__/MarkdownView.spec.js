import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MarkdownView from '../MarkdownView.vue'
import { MARKDOWN_TEXT } from './contentTestData'

describe('MarkdownView', () => {
  it('renders Markdown as HTML', () => {
    const wrapper = mount(MarkdownView, { props: { text: MARKDOWN_TEXT } })

    expect(wrapper.find('h1').text()).toBe('Title')
    expect(wrapper.find('strong').text()).toBe('bold')
  })

  it('drops markup that could run script', () => {
    const wrapper = mount(MarkdownView, { props: { text: '<img src=x onerror="alert(1)">' } })

    expect(wrapper.html()).not.toContain('onerror')
  })

  it('renders nothing for empty text', () => {
    const wrapper = mount(MarkdownView, { props: { text: '' } })

    expect(wrapper.text()).toBe('')
  })
})
