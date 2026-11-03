import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeBlock from '../CodeBlock.vue'
import { JSON_TEXT, PLAIN_TEXT } from './contentTestData'

describe('CodeBlock', () => {
  it('shows plain text as it is when no language is given', () => {
    const wrapper = mount(CodeBlock, { props: { code: PLAIN_TEXT } })

    expect(wrapper.find('code').text()).toBe(PLAIN_TEXT)
    expect(wrapper.find('code').html()).not.toContain('hljs-')
  })

  it('marks up the code of a known language', () => {
    const wrapper = mount(CodeBlock, { props: { code: JSON_TEXT, language: 'json' } })

    expect(wrapper.find('code').html()).toContain('hljs-')
    expect(wrapper.find('code').text()).toContain('MEMORY')
  })

  it('escapes markup instead of rendering it', () => {
    const wrapper = mount(CodeBlock, { props: { code: '<script>alert(1)</script>' } })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('code').text()).toContain('<script>')
  })

  it('falls back to escaped text for a language highlight.js does not know', () => {
    const wrapper = mount(CodeBlock, { props: { code: '<b>x</b>', language: 'klingon' } })

    expect(wrapper.find('b').exists()).toBe(false)
    expect(wrapper.find('code').text()).toBe('<b>x</b>')
  })
})
