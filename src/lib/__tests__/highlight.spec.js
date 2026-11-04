import { describe, expect, it } from 'vitest'
import { DocumentType } from '../../api/enums'
import { escapeHtml, highlight, languageForType } from '../highlight'
import { CSS_CONTENT, JSON_CONTENT, TEXT_CONTENT, TOON_CONTENT } from './documentContentTestData'

describe('languageForType', () => {
  it.each([
    [DocumentType.JSON, 'json'],
    [DocumentType.CSS, 'css'],
    [DocumentType.TOON, 'toon'],
    [DocumentType.XML, 'xml'],
    [DocumentType.HTML, 'xml'],
    [DocumentType.MARKDOWN, 'markdown'],
  ])('maps %s to the %s grammar', (type, language) => {
    expect(languageForType(type)).toBe(language)
  })

  it.each([DocumentType.TEXT, DocumentType.CUSTOM])('has no grammar for %s', (type) => {
    expect(languageForType(type)).toBeNull()
  })
})

describe('escapeHtml', () => {
  it('escapes the characters that would open a tag or attribute', () => {
    expect(escapeHtml('<b class="x">a & b</b>')).toBe('&lt;b class=&quot;x&quot;&gt;a &amp; b&lt;/b&gt;')
  })

  it('turns a missing value into an empty string', () => {
    expect(escapeHtml(null)).toBe('')
  })
})

describe('highlight', () => {
  it('escapes plain text when there is no language', () => {
    expect(highlight('a < b', null)).toBe('a &lt; b')
  })

  it('escapes plain text when the language is unknown', () => {
    expect(highlight('a < b', 'klingon')).toBe('a &lt; b')
  })

  it('highlights JSON keys and strings', () => {
    const html = highlight(JSON_CONTENT, 'json')

    expect(html).toContain('<span class="hljs-attr">&quot;name&quot;</span>')
    expect(html).toContain('<span class="hljs-string">&quot;document-service-ui&quot;</span>')
    expect(html).toContain('hljs-literal')
  })

  it('highlights CSS comments, properties and at-rules', () => {
    const html = highlight(CSS_CONTENT, 'css')

    expect(html).toContain('hljs-comment')
    expect(html).toContain('hljs-attribute')
    expect(html).toContain('hljs-keyword')
  })

  it('does not highlight plain text as code', () => {
    expect(highlight(TEXT_CONTENT, null)).toBe(escapeHtml(TEXT_CONTENT))
  })
})

describe('the TOON grammar', () => {
  it('highlights keys, including keys of tabular arrays', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('<span class="hljs-attr">project</span>')
    expect(html).toContain('<span class="hljs-attr">types</span>')
  })

  it('highlights array lengths and field lists', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('<span class="hljs-number">[8]</span>')
    expect(html).toContain('<span class="hljs-params">{name,extension,view}</span>')
  })

  it('highlights list markers, literals and quoted strings', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('<span class="hljs-bullet">  -</span>')
    expect(html).toContain('<span class="hljs-literal">true</span>')
    expect(html).toContain('<span class="hljs-string">&quot;&quot;</span>')
  })

  it('highlights a timestamp as one value', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('<span class="hljs-number">2026-10-19T18:00:00Z</span>')
  })

  it('leaves a version inside a word alone', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('Apache-2.0')
    expect(html).toContain('BSD-3-Clause')
  })

  it('leaves unquoted row values plain', () => {
    const html = highlight(TOON_CONTENT, 'toon')

    expect(html).toContain('TEXT,.txt,plain')
  })
})
