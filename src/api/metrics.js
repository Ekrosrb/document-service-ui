import { http } from './http'

/**
 * Counts live entries per document type, as `[{ type, count }]`. `kind` narrows the count
 * to documents or to memories. Deleted and superseded entries are left out, and so are
 * types that have no entries at all.
 */
export async function getTypeCounts({ kind } = {}) {
  const { data } = await http.get('/metric/count/type', { params: { kind } })
  return data
}
