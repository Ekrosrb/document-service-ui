import { RelationType } from '@/api/enums'
import { buildDeletedDocument, buildDocument, buildRelation } from '@/components/__tests__/componentTestData'

export const REFERRING_ID = 404
export const REFERRING_NAME = 'Newer note'

export function buildLinkedDocument(overrides = {}) {
  return buildDocument({
    relations: [buildRelation()],
    referencedBy: [buildRelation({ id: REFERRING_ID, name: REFERRING_NAME, type: RelationType.SUPERSEDES })],
    ...overrides,
  })
}

export function buildRelatedDocument() {
  return buildDocument({ id: buildRelation().id, name: buildRelation().name, relations: [], referencedBy: [] })
}

export function buildTrashedDocument(overrides = {}) {
  return buildDeletedDocument({ relations: [], referencedBy: [], ...overrides })
}
