// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../markdown'
import { MARKDOWN_CONTENT, SCRIPT_MARKDOWN_CONTENT } from './documentContentTestData'

describe('renderMarkdown', () => {
  it('renders headings, lists and tables', () => {
    const html = renderMarkdown(MARKDOWN_CONTENT)

    expect(html).toContain('<h1>Document types</h1>')
    expect(html).toContain('<ol>')
    expect(html).toContain('<table>')
    expect(html).toContain('<blockquote>')
  })

  it('highlights fenced code blocks', () => {
    const html = renderMarkdown(MARKDOWN_CONTENT)

    expect(html).toContain('<pre class="hljs">')
    expect(html).toContain('hljs-keyword')
  })

  it('keeps harmless inline HTML', () => {
    expect(renderMarkdown(MARKDOWN_CONTENT)).toContain('<kbd>Ctrl</kbd>')
  })

  it('strips scripts', () => {
    const html = renderMarkdown(SCRIPT_MARKDOWN_CONTENT)

    expect(html).not.toContain('<script')
    expect(html).not.toContain('document.title')
  })

  it('makes links open in a new tab', () => {
    const html = renderMarkdown(SCRIPT_MARKDOWN_CONTENT)

    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('renders a missing value as nothing', () => {
    expect(renderMarkdown(null)).toBe('')
  })
})
