import { describe, expect, it } from 'vitest'
import { Author, DocumentKind, DocumentType, MemoryType, Scope } from '@/api/enums'
import {
  MAX_LENGTHS,
  REQUIRED_MESSAGE,
  createDraftForm,
  createEditForm,
  toCreateRequest,
  toUpdateRequest,
  tooLongMessage,
  validateCreateForm,
  validateEditForm,
} from '../documentEdit'
import {
  BLANK,
  CUSTOM_EXTENSION,
  NAME,
  buildEditForm,
  buildEditableDocument,
} from './editTestData'

describe('createEditForm', () => {
  it('copies the editable fields and turns null into an empty value', () => {
    expect(createEditForm(buildEditableDocument())).toEqual(buildEditForm())
  })

  it('builds an empty form without a document', () => {
    expect(createEditForm()).toEqual({
      type: '',
      memoryType: '',
      name: '',
      authorName: '',
      projectKey: '',
      summary: '',
      content: '',
      customExtension: '',
      allowMcpWrite: false,
    })
  })
})

describe('toUpdateRequest', () => {
  it('is empty while nothing changed', () => {
    const document = buildEditableDocument()

    expect(toUpdateRequest(createEditForm(document), document)).toEqual({})
  })

  it('keeps only the changed fields', () => {
    const document = buildEditableDocument()
    const form = buildEditForm({ name: 'New name', memoryType: MemoryType.DECISION, allowMcpWrite: false })

    expect(toUpdateRequest(form, document)).toEqual({
      name: 'New name',
      memoryType: MemoryType.DECISION,
      allowMcpWrite: false,
    })
  })

  it('trims text fields but sends content as typed', () => {
    const document = buildEditableDocument({ name: null, content: 'old' })
    const form = buildEditForm({ name: `  ${NAME}  `, content: '  new  ' })

    expect(toUpdateRequest(form, document)).toMatchObject({ name: NAME, content: '  new  ' })
  })

  it('treats a blank text field as cleared', () => {
    const document = buildEditableDocument()

    expect(toUpdateRequest(buildEditForm({ name: BLANK }), document)).toEqual({ name: '' })
  })

  it('leaves out an enum that was never set', () => {
    const document = buildEditableDocument({ type: DocumentType.TEXT })

    expect(toUpdateRequest(buildEditForm({ type: '' }), document)).toEqual({})
  })
})

describe('createDraftForm', () => {
  it('starts as a human-authored text document that MCP may write', () => {
    expect(createDraftForm()).toMatchObject({
      kind: '',
      scope: '',
      author: Author.HUMAN,
      type: DocumentType.TEXT,
      allowMcpWrite: true,
      summary: '',
      content: '',
    })
  })
})

describe('toCreateRequest', () => {
  it('sends the required fields and leaves out the empty optional ones', () => {
    const form = { ...createDraftForm(), kind: DocumentKind.DOCUMENT, scope: Scope.GLOBAL, summary: '  s  ', content: 'c' }

    expect(toCreateRequest(form)).toEqual({
      kind: DocumentKind.DOCUMENT,
      scope: Scope.GLOBAL,
      author: Author.HUMAN,
      type: DocumentType.TEXT,
      summary: 's',
      content: 'c',
      allowMcpWrite: true,
    })
  })

  it('keeps the filled optional fields', () => {
    const form = {
      ...createDraftForm(),
      kind: DocumentKind.MEMORY,
      scope: Scope.PROJECT,
      memoryType: MemoryType.FACT,
      name: `  ${NAME}  `,
      projectKey: 'document-service-ui',
      summary: 's',
      content: 'c',
    }

    expect(toCreateRequest(form)).toMatchObject({
      memoryType: MemoryType.FACT,
      name: NAME,
      projectKey: 'document-service-ui',
    })
  })
})

describe('validateCreateForm', () => {
  it('names every field the server requires', () => {
    expect(validateCreateForm(createDraftForm())).toEqual({
      kind: REQUIRED_MESSAGE,
      scope: REQUIRED_MESSAGE,
      summary: REQUIRED_MESSAGE,
      content: REQUIRED_MESSAGE,
    })
  })

  it('accepts a draft with the required fields filled in', () => {
    const form = { ...createDraftForm(), kind: DocumentKind.MEMORY, scope: Scope.GLOBAL, summary: 's', content: 'c' }

    expect(validateCreateForm(form)).toEqual({})
  })
})

describe('validateEditForm', () => {
  it('accepts a form within the length limits', () => {
    expect(validateEditForm(buildEditForm({ customExtension: CUSTOM_EXTENSION }))).toEqual({})
  })

  it('rejects text longer than the server allows', () => {
    const form = buildEditForm({ summary: 'x'.repeat(MAX_LENGTHS.summary + 1) })

    expect(validateEditForm(form)).toEqual({ summary: tooLongMessage(MAX_LENGTHS.summary) })
  })
})
