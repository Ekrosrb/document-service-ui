import { DocumentKind, DocumentType, RelationType, Scope } from '@/api/enums'
import { formatEnum } from './format'

/** File extension shown for each document type; CUSTOM uses the document's own extension. */
export const TYPE_EXTENSIONS = Object.freeze({
  [DocumentType.TEXT]: '.txt',
  [DocumentType.JSON]: '.json',
  [DocumentType.HLD]: '.hld',
  [DocumentType.XML]: '.xml',
  [DocumentType.MARKDOWN]: '.md',
  [DocumentType.TOON]: '.toon',
  [DocumentType.HTML]: '.html',
  [DocumentType.CSS]: '.css',
  [DocumentType.CUSTOM]: '',
})

export function documentName(document) {
  if (!document) return ''
  return document.name || `Untitled #${document.id ?? ''}`.trim()
}

export function documentExtension(document) {
  if (!document) return ''
  return document.type === DocumentType.CUSTOM ? (document.customExtension ?? '') : (TYPE_EXTENSIONS[document.type] ?? '')
}

/** Memories show their memory type; plain documents show "Document". */
export function kindLabel(document) {
  return document?.kind === DocumentKind.MEMORY ? formatEnum(document.memoryType) || 'Memory' : 'Document'
}

export function kindVariant(document) {
  return document?.kind === DocumentKind.MEMORY ? 'accent' : 'neutral'
}

/** One line for the scope: the project key for project scope, the scope name otherwise. */
export function scopeLine(document) {
  return document?.scope === Scope.PROJECT ? document.projectKey || formatEnum(Scope.PROJECT) : formatEnum(document?.scope)
}

/**
 * Whether another document supersedes this one. It reads `referencedBy`, so it is only
 * meaningful when the document was loaded with its relations.
 */
export function isSuperseded(document) {
  return Boolean(document?.referencedBy?.some((relation) => relation.type === RelationType.SUPERSEDES))
}

export function slugify(value) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Name of the file the content would be saved as, used as a caption above the content. */
export function contentFilename(document) {
  if (!document) return ''
  return (slugify(document.name) || `document-${document.id}`) + documentExtension(document)
}

export function contentSize(content) {
  const bytes = new Blob([content ?? '']).size
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`
}

export function lineCount(content) {
  return (content ?? '').split('\n').length
}
