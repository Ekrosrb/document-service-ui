import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { textOf } from '@/components/__tests__/componentTestData'
import XmlView from '../XmlView.vue'
import XmlNode from '../XmlNode.vue'
import { BROKEN_XML_TEXT, XML_TEXT } from './contentTestData'

const NESTED_XML = '<ledger><entry id="1"><amount>12</amount></entry></ledger>'

describe('XmlView', () => {
  it('renders the document as a tree of nodes', () => {
    const wrapper = mount(XmlView, { props: { text: XML_TEXT } })

    expect(wrapper.findComponent(XmlNode).exists()).toBe(true)
    expect(textOf(wrapper)).toContain('ledger')
    expect(textOf(wrapper)).toContain('version')
  })

  it('shows the parser error for malformed XML instead of a tree', () => {
    const wrapper = mount(XmlView, { props: { text: BROKEN_XML_TEXT } })

    expect(wrapper.findComponent(XmlNode).exists()).toBe(false)
    expect(wrapper.find('p').text()).not.toBe('')
  })
})

describe('XmlNode', () => {
  it('collapses an element that has element children', async () => {
    const wrapper = mount(XmlView, { props: { text: NESTED_XML } })
    const collapse = wrapper.find('button[aria-expanded="true"]')

    expect(textOf(wrapper)).toContain('amount')
    await collapse.trigger('click')

    expect(textOf(wrapper)).not.toContain('amount')
  })

  it('expands a collapsed element again', async () => {
    const wrapper = mount(XmlView, { props: { text: NESTED_XML } })

    await wrapper.find('button[aria-expanded="true"]').trigger('click')
    await wrapper.find('button[aria-expanded="false"]').trigger('click')

    expect(textOf(wrapper)).toContain('amount')
  })

  it('keeps an element with only text on one line, with no collapse control', () => {
    const wrapper = mount(XmlView, { props: { text: '<name>Mira</name>' } })

    expect(textOf(wrapper)).toContain('Mira')
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows comments and CDATA sections', () => {
    const wrapper = mount(XmlView, { props: { text: '<root><!--note--><![CDATA[raw]]></root>' } })

    expect(textOf(wrapper)).toContain('note')
    expect(textOf(wrapper)).toContain('raw')
  })

  it('shows a processing instruction', () => {
    const wrapper = mount(XmlView, { props: { text: '<?xml-stylesheet href="a.xsl"?><root/>' } })

    expect(textOf(wrapper)).toContain('xml-stylesheet')
  })
})
