import { http } from './http'

const RELATIONS = '/document/relation'

/** Links `documentId` to `relatedDocumentId`, read as "document <type> related document". */
export async function createDocumentRelation({ documentId, relatedDocumentId, type }) {
  await http.post(RELATIONS, { documentId, relatedDocumentId, type })
}

export async function removeDocumentRelation(documentId, relatedDocumentId) {
  await http.delete(`${RELATIONS}/${documentId}/${relatedDocumentId}`)
}
