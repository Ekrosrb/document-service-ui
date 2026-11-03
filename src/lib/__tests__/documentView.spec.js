import { describe, expect, it } from 'vitest'
import { DocumentType, Scope } from '@/api/enums'
import {
  contentFilename,
  contentSize,
  documentExtension,
  documentName,
  isSuperseded,
  kindLabel,
  kindVariant,
  lineCount,
  scopeLine,
  slugify,
} from '../documentView'
import {
  CUSTOM_EXTENSION,
  DOCUMENT_ID,
  NAME,
  PROJECT_KEY,
  buildDocument,
  buildMemory,
  buildReferencedDocument,
  buildSupersededDocument,
} from './documentViewTestData'

describe('documentName', () => {
  it('uses the name when there is one', () => {
    expect(documentName(buildDocument())).toBe(NAME)
  })

  it('falls back to the id of a document without a name', () => {
    expect(documentName(buildDocument({ name: '' }))).toBe(`Untitled #${DOCUMENT_ID}`)
  })

  it('is empty when there is no document', () => {
    expect(documentName(null)).toBe('')
  })
})

describe('documentExtension', () => {
  it('maps the type to its extension', () => {
    expect(documentExtension(buildDocument())).toBe('.md')
  })

  it('takes the document’s own extension for type CUSTOM', () => {
    const document = buildDocument({ type: DocumentType.CUSTOM, customExtension: CUSTOM_EXTENSION })

    expect(documentExtension(document)).toBe(CUSTOM_EXTENSION)
  })
})

describe('kindLabel and kindVariant', () => {
  it('labels a document', () => {
    expect(kindLabel(buildDocument())).toBe('Document')
    expect(kindVariant(buildDocument())).toBe('neutral')
  })

  it('labels a memory with its memory type', () => {
    expect(kindLabel(buildMemory())).toBe('Decision')
    expect(kindVariant(buildMemory())).toBe('accent')
  })
})

describe('scopeLine', () => {
  it('shows the project key for project scope', () => {
    expect(scopeLine(buildDocument({ scope: Scope.PROJECT, projectKey: PROJECT_KEY }))).toBe(PROJECT_KEY)
  })

  it('shows the scope name otherwise', () => {
    expect(scopeLine(buildDocument())).toBe('Global')
  })
})

describe('isSuperseded', () => {
  it('is true when another document supersedes it', () => {
    expect(isSuperseded(buildSupersededDocument())).toBe(true)
  })

  it('is false for other relation types and for missing relations', () => {
    expect(isSuperseded(buildReferencedDocument())).toBe(false)
    expect(isSuperseded(buildDocument({ referencedBy: undefined }))).toBe(false)
  })
})

describe('contentFilename', () => {
  it('slugifies the name and appends the extension', () => {
    expect(contentFilename(buildDocument())).toBe('service-overview.md')
  })

  it('falls back to the id when there is no name', () => {
    expect(contentFilename(buildDocument({ name: '' }))).toBe(`document-${DOCUMENT_ID}.md`)
  })
})

describe('slugify, lineCount and contentSize', () => {
  it('slugifies punctuation into single dashes', () => {
    expect(slugify('Refund flow: v2 design!')).toBe('refund-flow-v2-design')
  })

  it('counts lines, an empty text being one line', () => {
    expect(lineCount('a\nb\nc')).toBe(3)
    expect(lineCount('')).toBe(1)
  })

  it('shows bytes below a kilobyte and kilobytes above it', () => {
    expect(contentSize('abc')).toBe('3 B')
    expect(contentSize('x'.repeat(2048))).toBe('2.0 KB')
  })
})
