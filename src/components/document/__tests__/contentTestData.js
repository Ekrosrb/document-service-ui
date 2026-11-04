import { DocumentType } from '@/api/enums'

export const PLAIN_TEXT = 'First line\nSecond line\n\nFourth line'
export const JSON_TEXT = '{\n  "kind": "MEMORY"\n}'
export const MARKDOWN_TEXT = '# Title\n\nA **bold** word.'
export const XML_TEXT = '<ledger version="2"><entry id="1" /></ledger>'
export const BROKEN_XML_TEXT = '<ledger><entry></ledger>'
export const HTML_TEXT = '<p>Hello</p>'
export const CSS_TEXT = 'body { color: red; }'
export const FILENAME = 'service-overview.md'

export const RENDERED_TYPES = Object.freeze([DocumentType.XML, DocumentType.MARKDOWN, DocumentType.HTML])
export const PLAIN_TYPES = Object.freeze([DocumentType.TEXT, DocumentType.CUSTOM])

export function buildFrameProps(overrides = {}) {
  return { content: PLAIN_TEXT, type: DocumentType.TEXT, filename: FILENAME, name: '105', ...overrides }
}
