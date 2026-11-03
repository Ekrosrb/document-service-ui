import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { DocumentType } from '@/api/enums'
import { textOf } from '@/components/__tests__/componentTestData'
import ContentFrame from '../ContentFrame.vue'
import DocumentContent from '../DocumentContent.vue'
import RawLines from '../RawLines.vue'
import { FILENAME, MARKDOWN_TEXT, PLAIN_TEXT, buildFrameProps } from './contentTestData'

const modeRadios = (wrapper) => wrapper.findAll('input[type="radio"]')

describe('ContentFrame', () => {
  it('captions the content with its file name, line count and size', () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps() })

    expect(textOf(wrapper)).toContain(FILENAME)
    expect(textOf(wrapper)).toContain('4 lines')
    expect(textOf(wrapper)).toContain(`${new Blob([PLAIN_TEXT]).size} B`)
  })

  it('renders the content for its type to begin with', () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps({ content: MARKDOWN_TEXT, type: DocumentType.MARKDOWN }) })

    expect(wrapper.findComponent(DocumentContent).exists()).toBe(true)
    expect(wrapper.findComponent(RawLines).exists()).toBe(false)
  })

  it('switches to numbered lines when that mode is picked', async () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps() })

    await modeRadios(wrapper)[1].setValue()

    expect(wrapper.findComponent(RawLines).exists()).toBe(true)
    expect(wrapper.findComponent(DocumentContent).exists()).toBe(false)
  })

  it('switches back to the rendered view', async () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps() })

    await modeRadios(wrapper)[1].setValue()
    await modeRadios(wrapper)[0].setValue()

    expect(wrapper.findComponent(DocumentContent).exists()).toBe(true)
  })

  it('names the mode group after the document, so two frames do not share it', () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps({ name: '42' }) })

    expect(modeRadios(wrapper)[0].attributes('name')).toBe('content-mode-42')
  })

  it('counts a kilobyte and over in kilobytes', () => {
    const wrapper = mount(ContentFrame, { props: buildFrameProps({ content: 'x'.repeat(2048) }) })

    expect(textOf(wrapper)).toContain('2.0 KB')
  })
})
