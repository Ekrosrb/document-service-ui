import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DocumentType } from '@/api/enums'
import DocumentContent from '../DocumentContent.vue'
import CodeBlock from '../CodeBlock.vue'
import HtmlFrame from '../HtmlFrame.vue'
import MarkdownView from '../MarkdownView.vue'
import XmlView from '../XmlView.vue'
import { CSS_TEXT, HTML_TEXT, JSON_TEXT, MARKDOWN_TEXT, PLAIN_TEXT, PLAIN_TYPES, XML_TEXT } from './contentTestData'

const toggle = (wrapper) => wrapper.find('button')

describe('DocumentContent rendered types', () => {
  it('renders XML as a tree', () => {
    const wrapper = mount(DocumentContent, { props: { content: XML_TEXT, type: DocumentType.XML } })

    expect(wrapper.findComponent(XmlView).exists()).toBe(true)
  })

  it('renders Markdown as formatted text', () => {
    const wrapper = mount(DocumentContent, { props: { content: MARKDOWN_TEXT, type: DocumentType.MARKDOWN } })

    expect(wrapper.findComponent(MarkdownView).exists()).toBe(true)
  })

  it('renders HTML in a sandboxed frame', () => {
    const wrapper = mount(DocumentContent, { props: { content: HTML_TEXT, type: DocumentType.HTML } })

    expect(wrapper.findComponent(HtmlFrame).exists()).toBe(true)
  })

  it('offers a toggle that swaps the rendered view for the source', async () => {
    const wrapper = mount(DocumentContent, { props: { content: MARKDOWN_TEXT, type: DocumentType.MARKDOWN } })

    expect(toggle(wrapper).text()).toBe('Raw')
    await toggle(wrapper).trigger('click')

    expect(wrapper.findComponent(MarkdownView).exists()).toBe(false)
    expect(wrapper.findComponent(CodeBlock).exists()).toBe(true)
    expect(toggle(wrapper).text()).toBe('Rendered')
  })

  it('goes back to the rendered view when the content changes', async () => {
    const wrapper = mount(DocumentContent, { props: { content: MARKDOWN_TEXT, type: DocumentType.MARKDOWN } })

    await toggle(wrapper).trigger('click')
    await wrapper.setProps({ content: `${MARKDOWN_TEXT}\n\nMore.` })

    expect(wrapper.findComponent(MarkdownView).exists()).toBe(true)
  })
})

describe('DocumentContent code types', () => {
  it.each([
    [DocumentType.JSON, JSON_TEXT],
    [DocumentType.CSS, CSS_TEXT],
    [DocumentType.TOON, 'rows[1]{id}:\n  1'],
  ])('shows %s as a highlighted code block with no toggle', (type, content) => {
    const wrapper = mount(DocumentContent, { props: { content, type } })

    expect(wrapper.findComponent(CodeBlock).exists()).toBe(true)
    expect(toggle(wrapper).exists()).toBe(false)
  })

  it.each(PLAIN_TYPES)('shows %s as plain text with no toggle', (type) => {
    const wrapper = mount(DocumentContent, { props: { content: PLAIN_TEXT, type } })

    expect(wrapper.findComponent(CodeBlock).exists()).toBe(true)
    expect(wrapper.text()).toContain('First line')
    expect(toggle(wrapper).exists()).toBe(false)
  })
})
