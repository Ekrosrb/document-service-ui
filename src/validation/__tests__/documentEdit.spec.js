import { describe, expect, it } from 'vitest'
import { DocumentType, MemoryType } from '@/api/enums'
import { MAX_LENGTHS, createEditForm, toUpdateRequest, tooLongMessage, validateEditForm } from '../documentEdit'
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

describe('validateEditForm', () => {
  it('accepts a form within the length limits', () => {
    expect(validateEditForm(buildEditForm({ customExtension: CUSTOM_EXTENSION }))).toEqual({})
  })

  it('rejects text longer than the server allows', () => {
    const form = buildEditForm({ summary: 'x'.repeat(MAX_LENGTHS.summary + 1) })

    expect(validateEditForm(form)).toEqual({ summary: tooLongMessage(MAX_LENGTHS.summary) })
  })
})
