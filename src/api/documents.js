import { http } from './http'

const DOCUMENTS = '/document'

export async function getDocument(id, { includeContent } = {}) {
  const { data } = await http.get(`${DOCUMENTS}/${id}`, { params: { includeContent } })
  return data
}

/** Creates a document or memory, depending on `request.kind`, and resolves to `{ id }`. */
export async function createDocument(request) {
  const { data } = await http.post(DOCUMENTS, request)
  return data
}

export async function updateDocument(id, request) {
  await http.put(`${DOCUMENTS}/${id}`, request)
}

/** Soft-deletes a document; it can be brought back with restoreDocument. */
export async function removeDocument(id) {
  await http.delete(`${DOCUMENTS}/${id}`)
}

/** Deletes a document for good; it cannot be restored. */
export async function removeDocumentPermanently(id) {
  await http.delete(`${DOCUMENTS}/${id}/permanent`)
}

/** Restores a soft-deleted document. */
export async function restoreDocument(id) {
  await http.post(`${DOCUMENTS}/${id}/restore`)
}

/**
 * Searches documents and memories by the filters in `request` and resolves to a Spring
 * page. `pageable` takes `page`, `size` and `sort` (a string or an array of "field,dir").
 */
export async function searchDocuments(request = {}, pageable = {}) {
  const { data } = await http.post(`${DOCUMENTS}/search`, request, { params: pageable })
  return data
}

/** Lists soft-deleted documents as a Spring page. */
export async function getDeletedDocuments(pageable = {}) {
  const { data } = await http.get(`${DOCUMENTS}/deleted`, { params: pageable })
  return data
}

export async function getDeletedDocument(id, { includeContent } = {}) {
  const { data } = await http.get(`${DOCUMENTS}/deleted/${id}`, { params: { includeContent } })
  return data
}
