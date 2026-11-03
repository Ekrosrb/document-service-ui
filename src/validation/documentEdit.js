import { DocumentType, MemoryType } from '@/api/enums'

/** Fields a PUT /document/{id} accepts; everything else is read-only. */
export const EDITABLE_ENUM_FIELDS = Object.freeze({ type: Object.values(DocumentType), memoryType: Object.values(MemoryType) })
export const EDITABLE_TEXT_FIELDS = Object.freeze(['name', 'authorName', 'projectKey', 'summary', 'content', 'customExtension'])

/** Server-side maxLength of the text fields; content is unbounded. */
export const MAX_LENGTHS = Object.freeze({ name: 250, authorName: 250, projectKey: 250, summary: 1024, customExtension: 50 })

export const tooLongMessage = (max) => `At most ${max} characters.`

/** Copies the editable fields of a document into a form, with null as an empty value. */
export function createEditForm(document = {}) {
  const form = { allowMcpWrite: Boolean(document.allowMcpWrite) }
  for (const field of Object.keys(EDITABLE_ENUM_FIELDS)) form[field] = document[field] ?? ''
  for (const field of EDITABLE_TEXT_FIELDS) form[field] = document[field] ?? ''
  return form
}

/**
 * Builds a DocumentUpdateRequest holding only the fields that differ from `document`.
 * Text fields are trimmed, except `content`, which is sent as typed; an enum cannot be
 * cleared, so an empty enum is left out.
 */
export function toUpdateRequest(form, document = {}) {
  const request = {}
  for (const field of Object.keys(EDITABLE_ENUM_FIELDS)) {
    if (form[field] && form[field] !== document[field]) request[field] = form[field]
  }
  for (const field of EDITABLE_TEXT_FIELDS) {
    const value = normalizeText(field, form[field])
    if (value !== normalizeText(field, document[field])) request[field] = value
  }
  if (Boolean(form.allowMcpWrite) !== Boolean(document.allowMcpWrite)) request.allowMcpWrite = Boolean(form.allowMcpWrite)
  return request
}

/** Checks the form against the server's length limits. Returns messages keyed by field. */
export function validateEditForm(form) {
  const errors = {}
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (normalizeText(field, form[field]).length > max) errors[field] = tooLongMessage(max)
  }
  return errors
}

function normalizeText(field, value) {
  const text = value ?? ''
  return field === 'content' ? text : text.trim()
}
