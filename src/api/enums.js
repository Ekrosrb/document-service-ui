export const DocumentKind = Object.freeze({
  DOCUMENT: 'DOCUMENT',
  MEMORY: 'MEMORY',
})

export const Scope = Object.freeze({
  GLOBAL: 'GLOBAL',
  PROJECT: 'PROJECT',
  AGENT: 'AGENT',
})

export const DocumentType = Object.freeze({
  TEXT: 'TEXT',
  JSON: 'JSON',
  XML: 'XML',
  MARKDOWN: 'MARKDOWN',
  TOON: 'TOON',
  HTML: 'HTML',
  CSS: 'CSS',
  CUSTOM: 'CUSTOM',
})

export const Author = Object.freeze({
  HUMAN: 'HUMAN',
  AGENT: 'AGENT',
})

export const MemoryType = Object.freeze({
  DECISION: 'DECISION',
  RULE: 'RULE',
  FACT: 'FACT',
  OBSERVATION: 'OBSERVATION',
  PROCEDURE: 'PROCEDURE',
  PITFALL: 'PITFALL',
  STATUS: 'STATUS',
})

export const RelationType = Object.freeze({
  DEPENDS_ON: 'DEPENDS_ON',
  SUPERSEDES: 'SUPERSEDES',
  EXTENDS: 'EXTENDS',
  PART_OF: 'PART_OF',
  DERIVED_FROM: 'DERIVED_FROM',
  RELATED_TO: 'RELATED_TO',
})
