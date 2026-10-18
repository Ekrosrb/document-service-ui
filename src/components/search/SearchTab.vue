<script setup>
import { onMounted, shallowRef, useTemplateRef } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { getProjectsInfo, searchDocuments } from '@/api'
import { usePagedList } from '@/composables/usePagedList'
import { Button } from '@/components/ui/button'
import SearchForm from './SearchForm.vue'
import SearchResults from './SearchResults.vue'

const root = useTemplateRef('root')
const request = shallowRef(null)
const projectKeys = shallowRef([])

const { items: documents, total, loading, error, hasMore, loadMore, reset } = usePagedList(
  (pageable) => searchDocuments(request.value, pageable),
  { size: 20 },
)

const { reset: recheckScroll } = useInfiniteScroll(window, loadMore, {
  distance: 200,
  canLoadMore: () => request.value !== null && hasMore.value && !error.value && root.value?.offsetParent != null,
})

function search(newRequest) {
  request.value = newRequest
  reset()
  recheckScroll()
}

onMounted(async () => {
  try {
    const page = await getProjectsInfo({ size: 200, sort: 'projectKey,asc' })
    projectKeys.value = page.content.map((project) => project.projectKey)
  } catch {
    projectKeys.value = []
  }
})
</script>

<template>
  <div ref="root" class="flex flex-col gap-6">
    <SearchForm :project-keys="projectKeys" :loading="loading" @search="search" />

    <template v-if="request">
      <p v-if="total !== null" class="text-sm text-steel-gray">
        {{ total }} {{ total === 1 ? 'result' : 'results' }}
      </p>
      <SearchResults v-if="documents.length" :documents="documents" />

      <p v-if="loading" class="text-center text-sm text-steel-gray">Searching…</p>
      <div v-else-if="error" class="flex flex-col items-center gap-2 text-sm">
        <div class="flex items-center gap-3">
          <span class="text-destructive">{{ error.message }}</span>
          <Button variant="outline" size="sm" @click="loadMore">Retry</Button>
        </div>
        <ul v-if="error.metadata && Object.keys(error.metadata).length" class="text-xs text-destructive/80">
          <li v-for="(message, field) in error.metadata" :key="field">{{ field }}: {{ message }}</li>
        </ul>
      </div>
      <p v-else-if="!documents.length && !hasMore" class="text-center text-sm text-steel-gray">Nothing found.</p>
    </template>
  </div>
</template>
