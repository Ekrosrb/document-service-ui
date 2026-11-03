import { Author, DocumentKind, DocumentType, MemoryType, Scope } from '@/api/enums'

/** Fields a PUT /document/{id} accepts; everything else is read-only. */
export const EDITABLE_ENUM_FIELDS = Object.freeze({ type: Object.values(DocumentType), memoryType: Object.values(MemoryType) })
export const EDITABLE_TEXT_FIELDS = Object.freeze(['name', 'authorName', 'projectKey', 'summary', 'content', 'customExtension'])

/** Server-side maxLength of the text fields; content is unbounded. */
export const MAX_LENGTHS = Object.freeze({ name: 250, authorName: 250, projectKey: 250, summary: 1024, customExtension: 50 })

/** Fields a POST /document needs on top of the editable ones, and the ones it requires. */
export const CREATE_ENUM_FIELDS = Object.freeze({
  kind: Object.values(DocumentKind),
  scope: Object.values(Scope),
  author: Object.values(Author),
})
export const REQUIRED_CREATE_FIELDS = Object.freeze(['kind', 'scope', 'author', 'summary', 'content'])

export const REQUIRED_MESSAGE = 'Required.'
export const PROJECT_KEY_REQUIRED_MESSAGE = 'Project key must be specified for scope: Project.'
export const CUSTOM_EXTENSION_REQUIRED_MESSAGE = 'Custom extension is required for type: Custom.'
export const tooLongMessage = (max) => `At most ${max} characters.`

/** Copies the editable fields of a document into a form, with null as an empty value. */
export function createEditForm(document = {}) {
  const form = { allowMcpWrite: Boolean(document.allowMcpWrite) }
  for (const field of Object.keys(EDITABLE_ENUM_FIELDS)) form[field] = document[field] ?? ''
  for (const field of EDITABLE_TEXT_FIELDS) form[field] = document[field] ?? ''
  return form
}

/** Returns the form of a document that does not exist yet, with the usual defaults. */
export function createDraftForm() {
  return { ...createEditForm(), kind: '', scope: '', author: Author.HUMAN, type: DocumentType.TEXT, allowMcpWrite: true }
}

/** Builds a DocumentCreateRequest from a draft form, leaving out the empty optional fields. */
export function toCreateRequest(form) {
  const request = {
    kind: form.kind,
    scope: form.scope,
    author: form.author,
    summary: normalizeText('summary', form.summary),
    content: form.content ?? '',
    allowMcpWrite: Boolean(form.allowMcpWrite),
  }
  for (const field of Object.keys(EDITABLE_ENUM_FIELDS)) {
    if (form[field]) request[field] = form[field]
  }
  for (const field of ['name', 'authorName', 'projectKey', 'customExtension']) {
    const value = normalizeText(field, form[field])
    if (value) request[field] = value
  }
  return request
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

/**
 * Checks the form against the server's length limits and the two fields the server makes
 * conditional: a project key for scope PROJECT, a custom extension for type CUSTOM. The
 * scope is not editable, so it is passed in; without it the project-key rule is skipped.
 */
export function validateEditForm(form, { scope } = {}) {
  const errors = {}
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (normalizeText(field, form[field]).length > max) errors[field] = tooLongMessage(max)
  }
  if (scope === Scope.PROJECT && !normalizeText('projectKey', form.projectKey)) {
    errors.projectKey = PROJECT_KEY_REQUIRED_MESSAGE
  }
  if (form.type === DocumentType.CUSTOM && !normalizeText('customExtension', form.customExtension)) {
    errors.customExtension = CUSTOM_EXTENSION_REQUIRED_MESSAGE
  }
  return errors
}

/** Checks a draft against the length limits and the fields the server requires. */
export function validateCreateForm(form) {
  const errors = validateEditForm(form, { scope: form.scope })
  for (const field of REQUIRED_CREATE_FIELDS) {
    if (!String(form[field] ?? '').trim()) errors[field] = REQUIRED_MESSAGE
  }
  return errors
}

function normalizeText(field, value) {
  const text = value ?? ''
  return field === 'content' ? text : text.trim()
}
