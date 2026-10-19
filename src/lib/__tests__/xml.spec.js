// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { isCollapsible, isTextOnlyElement, parseXml } from '../xml'
import {
  MALFORMED_XML_CONTENT,
  XML_CONTENT,
  buildElementNode,
  buildNestedElementNode,
  buildTextNode,
  buildTextOnlyElementNode,
} from './documentContentTestData'

describe('parseXml', () => {
  it('keeps the prolog comment and the root element', () => {
    const { nodes, error } = parseXml(XML_CONTENT)

    expect(error).toBeNull()
    expect(nodes.map((node) => node.kind)).toEqual(['comment', 'element'])
    expect(nodes[1].name).toBe('documentTypes')
  })

  it('reads attributes in order', () => {
    const { nodes } = parseXml(XML_CONTENT)
    const first = nodes[1].children[0]

    expect(first.attributes).toEqual([
      { name: 'name', value: 'TEXT' },
      { name: 'extension', value: '.txt' },
      { name: 'view', value: 'plain' },
    ])
  })

  it('drops whitespace-only text and trims the rest', () => {
    const { nodes } = parseXml(XML_CONTENT)
    const library = nodes[1].children[1].children[0]

    expect(library.children).toEqual([buildTextNode()])
  })

  it('keeps CDATA sections as their own nodes', () => {
    const { nodes } = parseXml(XML_CONTENT)
    const snippet = nodes[1].children[3].children[1]

    expect(snippet.children[0].kind).toBe('cdata')
    expect(snippet.children[0].value).toContain('<script>')
  })

  it('reports the parser message for a malformed document', () => {
    const { nodes, error } = parseXml(MALFORMED_XML_CONTENT)

    expect(nodes).toEqual([])
    expect(error).toBeTruthy()
  })
})

describe('isTextOnlyElement', () => {
  it('is true for an element holding one piece of text', () => {
    expect(isTextOnlyElement(buildTextOnlyElementNode())).toBe(true)
  })

  it('is false for an element with element children', () => {
    expect(isTextOnlyElement(buildNestedElementNode())).toBe(false)
  })

  it('is false for a text node', () => {
    expect(isTextOnlyElement(buildTextNode())).toBe(false)
  })
})

describe('isCollapsible', () => {
  it('is true for an element with element children', () => {
    expect(isCollapsible(buildNestedElementNode())).toBe(true)
  })

  it('is false for an empty element', () => {
    expect(isCollapsible(buildElementNode())).toBe(false)
  })

  it('is false for an element holding only text', () => {
    expect(isCollapsible(buildTextOnlyElementNode())).toBe(false)
  })
})
