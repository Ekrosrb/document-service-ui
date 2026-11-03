<script setup>
import { onMounted, shallowRef, useTemplateRef } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { getProjectsInfo, searchDocuments } from '@/api'
import { usePagedList } from '@/composables/usePagedList'
import { Button } from '@/components/ui/button'
import DocumentPanel from './DocumentPanel.vue'
import SearchForm from './SearchForm.vue'
import SearchResults from './SearchResults.vue'

const emit = defineEmits(['open-view'])

const root = useTemplateRef('root')
const request = shallowRef(null)
const projectKeys = shallowRef([])
const openDocument = shallowRef(null)

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

/** Drops a document deleted elsewhere from the results and closes its panel. */
function dropDocument(id) {
  const index = documents.value.findIndex((document) => document.id === id)
  if (index !== -1) {
    documents.value.splice(index, 1)
    if (total.value !== null) total.value -= 1
  }
  if (openDocument.value?.id === id) openDocument.value = null
}

/** Copies the fields of a document saved elsewhere into its result row. */
function applyUpdate(document) {
  const result = documents.value.find((item) => item.id === document.id)
  if (!result) return
  const { content, ...fields } = document
  Object.assign(result, fields)
}

defineExpose({ dropDocument, applyUpdate })

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

    <p v-if="request && total !== null" class="text-sm text-muted-foreground">
      {{ total }} {{ total === 1 ? 'result' : 'results' }}
    </p>

    <div
      v-if="request"
      class="grid items-start transition-[grid-template-columns,column-gap] duration-300 ease-out"
      :class="openDocument ? 'grid-cols-[1fr_3fr] gap-x-6' : 'grid-cols-[1fr_0fr] gap-x-0'"
    >
      <div class="flex min-w-0 flex-col gap-6">
        <SearchResults
          v-if="documents.length"
          :documents="documents"
          :compact="openDocument !== null"
          :open-id="openDocument?.id ?? null"
          @open="(document) => (openDocument = document)"
          @open-view="(document) => emit('open-view', document)"
        />

        <p v-if="loading" class="text-center text-sm text-muted-foreground">Searching…</p>
        <div v-else-if="error" class="flex flex-col items-center gap-2 text-sm">
          <div class="flex items-center gap-3">
            <span class="text-destructive">{{ error.message }}</span>
            <Button variant="outline" size="sm" @click="loadMore">Retry</Button>
          </div>
          <ul v-if="error.metadata && Object.keys(error.metadata).length" class="text-xs text-destructive/80">
            <li v-for="(message, field) in error.metadata" :key="field">{{ field }}: {{ message }}</li>
          </ul>
        </div>
        <p v-else-if="!documents.length && !hasMore" class="text-center text-sm text-muted-foreground">Nothing found.</p>
      </div>

      <div class="sticky top-20 min-w-0">
        <DocumentPanel v-if="openDocument" :document="openDocument" @close="openDocument = null" />
      </div>
    </div>
  </div>
</template>
