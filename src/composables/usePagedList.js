import { ref, shallowRef } from 'vue'

/**
 * Loads a Spring-paged list one page at a time and appends each page to `items`.
 * `fetchPage` receives `{ page, size, sort }` and resolves to a Spring page.
 * A failed load leaves `error` set; calling `loadMore` again retries the same page.
 * `reset` empties the list and discards any page still in flight.
 */
export function usePagedList(fetchPage, { size = 50, sort } = {}) {
  const items = ref([])
  const total = ref(null)
  const loading = ref(false)
  const error = shallowRef(null)
  const hasMore = ref(true)
  let nextPage = 0
  let generation = 0

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const current = generation
    loading.value = true
    error.value = null
    try {
      const page = await fetchPage({ page: nextPage, size, sort })
      if (current !== generation) return
      items.value.push(...page.content)
      total.value = page.totalElements ?? null
      hasMore.value = !page.last
      nextPage += 1
    } catch (e) {
      if (current === generation) error.value = e
    } finally {
      if (current === generation) loading.value = false
    }
  }

  function reset() {
    generation += 1
    items.value = []
    total.value = null
    loading.value = false
    error.value = null
    hasMore.value = true
    nextPage = 0
  }

  return { items, total, loading, error, hasMore, loadMore, reset }
}
