/**
 * highlight.js language definition for TOON, the indentation-based format the MCP tools
 * return. It colours keys, array length and field-list headers, list markers, quoted
 * strings, numbers and literals; unquoted row values stay plain.
 */
export function toon(hljs) {
  const KEY = {
    scope: 'attr',
    match:
      /(?<=^[ \t]*(?:-[ \t]+)?)(?:[A-Za-z_$][\w$-]*|"(?:\\.|[^"\\])*")(?=[ \t]*(?:\[[^\]\n]*\])?(?:\{[^}\n]*\})?[ \t]*:)/,
  }

  const LIST_MARKER = {
    scope: 'bullet',
    match: /^\s*-(?=\s|$)/,
  }

  const LENGTH = {
    scope: 'number',
    match: /\[\s*\d*\s*\]/,
  }

  const FIELDS = {
    scope: 'params',
    match: /\{[^}\n]*\}/,
  }

  const STRING = {
    scope: 'string',
    begin: /"/,
    end: /"/,
    illegal: /\n/,
    contains: [hljs.BACKSLASH_ESCAPE],
  }

  const LITERAL = {
    scope: 'literal',
    match: /\b(?:true|false|null)\b/,
  }

  const TIMESTAMP = {
    scope: 'number',
    match: /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z?)?\b/,
  }

  const NUMBER = {
    scope: 'number',
    match: /(?<![\w.-])-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
  }

  return {
    name: 'TOON',
    aliases: ['toon'],
    contains: [LIST_MARKER, STRING, KEY, LENGTH, FIELDS, LITERAL, TIMESTAMP, NUMBER],
  }
}
