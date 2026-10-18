import { http } from './http'

/** Lists project keys with their document counts as a Spring page. */
export async function getProjectsInfo(pageable = {}) {
  const { data } = await http.get('/project/info', { params: pageable })
  return data
}
