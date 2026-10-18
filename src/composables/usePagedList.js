import { ref, shallowRef } from 'vue'

/**
 * Loads a Spring-paged list one page at a time and appends each page to `items`.
 * `fetchPage` receives `{ page, size, sort }` and resolves to a Spring page.
 * A failed load leaves `error` set; calling `loadMore` again retries the same page.
 */
export function usePagedList(fetchPage, { size = 50, sort } = {}) {
  const items = ref([])
  const loading = ref(false)
  const error = shallowRef(null)
  const hasMore = ref(true)
  let nextPage = 0

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    loading.value = true
    error.value = null
    try {
      const page = await fetchPage({ page: nextPage, size, sort })
      items.value.push(...page.content)
      hasMore.value = !page.last
      nextPage += 1
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, hasMore, loadMore }
}
