import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import java from 'highlight.js/lib/languages/java'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { DocumentType } from '@/api/enums'
import { toon } from './toonLanguage'

const languages = { bash, css, java, javascript, json, markdown, python, sql, toon, typescript, xml, yaml }

for (const [name, definition] of Object.entries(languages)) hljs.registerLanguage(name, definition)

const languageByDocumentType = {
  [DocumentType.JSON]: 'json',
  [DocumentType.CSS]: 'css',
  [DocumentType.TOON]: 'toon',
  [DocumentType.XML]: 'xml',
  [DocumentType.HTML]: 'xml',
  [DocumentType.MARKDOWN]: 'markdown',
}

/** The highlight.js language for a document type, or null when the type is plain text. */
export function languageForType(type) {
  return languageByDocumentType[type] ?? null
}

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/**
 * Highlights code as HTML. Falls back to escaped plain text when the language is missing
 * or unknown, so the result is always safe to render with v-html.
 */
export function highlight(code, language) {
  const text = String(code ?? '')
  if (!language || !hljs.getLanguage(language)) return escapeHtml(text)
  return hljs.highlight(text, { language, ignoreIllegals: true }).value
}
