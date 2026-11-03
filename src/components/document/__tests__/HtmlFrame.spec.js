import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HtmlFrame from '../HtmlFrame.vue'
import { HTML_TEXT } from './contentTestData'

describe('HtmlFrame', () => {
  it('puts the document in a sandboxed frame that cannot reach this page', () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT } })
    const frame = wrapper.find('iframe')

    expect(frame.attributes('sandbox')).toBe('allow-scripts')
    expect(frame.attributes('srcdoc')).toContain(HTML_TEXT)
  })

  it('adds the script that reports the content height', () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT } })

    expect(wrapper.find('iframe').attributes('srcdoc')).toContain('document-service-ui:html-height')
  })

  it('stands at a default height until the frame reports one', () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT } })

    expect(wrapper.find('iframe').classes()).toContain('h-96')
    expect(wrapper.find('iframe').attributes('style')).toBeUndefined()
  })

  it('grows to the height the frame reports', async () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT }, attachTo: document.body })
    const source = wrapper.find('iframe').element.contentWindow

    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'document-service-ui:html-height', height: 320 }, source }),
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.find('iframe').attributes('style')).toContain('320px')
    wrapper.unmount()
  })

  it('ignores a height sent by anything but its own frame', async () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT }, attachTo: document.body })

    window.dispatchEvent(
      new MessageEvent('message', { data: { type: 'document-service-ui:html-height', height: 320 }, source: window }),
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.find('iframe').classes()).toContain('h-96')
    wrapper.unmount()
  })

  it('stops listening once it is gone', () => {
    const wrapper = mount(HtmlFrame, { props: { html: HTML_TEXT }, attachTo: document.body })

    wrapper.unmount()

    expect(() =>
      window.dispatchEvent(new MessageEvent('message', { data: { type: 'document-service-ui:html-height', height: 10 } })),
    ).not.toThrow()
  })
})
