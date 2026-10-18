import { describe, expect, it, vi } from 'vitest'
import { usePagedList } from '../usePagedList'
import {
  FIRST_ITEMS,
  LIST_OPTIONS,
  PAGE_SIZE,
  SECOND_ITEMS,
  SORT,
  buildError,
  buildFirstPage,
  buildLastPage,
} from './pagedListTestData'

describe('usePagedList', () => {
  it('loads the first page with the given size and sort', async () => {
    const fetchPage = vi.fn().mockResolvedValue(buildFirstPage())
    const { items, hasMore, loadMore } = usePagedList(fetchPage, LIST_OPTIONS)

    await loadMore()

    expect(fetchPage).toHaveBeenCalledWith({ page: 0, size: PAGE_SIZE, sort: SORT })
    expect(items.value).toEqual(FIRST_ITEMS)
    expect(hasMore.value).toBe(true)
  })

  it('appends the next page and stops after the last one', async () => {
    const fetchPage = vi.fn().mockResolvedValueOnce(buildFirstPage()).mockResolvedValueOnce(buildLastPage())
    const { items, hasMore, loadMore } = usePagedList(fetchPage, LIST_OPTIONS)

    await loadMore()
    await loadMore()
    await loadMore()

    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 1, size: PAGE_SIZE, sort: SORT })
    expect(items.value).toEqual([...FIRST_ITEMS, ...SECOND_ITEMS])
    expect(hasMore.value).toBe(false)
  })

  it('ignores loadMore while a page is loading', async () => {
    const fetchPage = vi.fn().mockResolvedValue(buildFirstPage())
    const { loading, loadMore } = usePagedList(fetchPage, LIST_OPTIONS)

    const first = loadMore()
    expect(loading.value).toBe(true)
    await loadMore()
    await first

    expect(fetchPage).toHaveBeenCalledTimes(1)
    expect(loading.value).toBe(false)
  })

  it('keeps the error and retries the same page on the next call', async () => {
    const error = buildError()
    const fetchPage = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce(buildFirstPage())
    const list = usePagedList(fetchPage, LIST_OPTIONS)

    await list.loadMore()
    expect(list.error.value).toBe(error)
    expect(list.items.value).toEqual([])

    await list.loadMore()
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 0, size: PAGE_SIZE, sort: SORT })
    expect(list.error.value).toBeNull()
    expect(list.items.value).toEqual(FIRST_ITEMS)
  })
})
