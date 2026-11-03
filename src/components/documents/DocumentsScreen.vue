<script setup>
import { computed, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { ChevronLeft, ChevronRight, Search } from '@lucide/vue'
import { Author, DocumentKind, MemoryType, Scope, searchDocuments } from '@/api'
import { useWorkspace } from '@/composables/useWorkspace'
import { createSearchForm, toSearchRequest } from '@/validation/documentSearch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Segmented } from '@/components/ui/segmented'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatEnum } from '@/lib/format'
import { documentExtension, documentName, isSuperseded, kindLabel, kindVariant } from '@/lib/documentView'

/**
 * The browsable list of documents and memories: full-text query, the filters the search
 * API takes, and one page of results at a time.
 */
const props = defineProps({
  /** Filters another screen asked for, applied once and then reported as applied. */
  applyFilters: { type: Object, default: null },
})

const emit = defineEmits(['applied', 'open'])

const PAGE_SIZE = 20
const ROW_COLUMNS = 'grid-cols-[minmax(0,1fr)_120px_72px_170px_150px_110px]'

const { projects, loadProjects } = useWorkspace()

const form = reactive(createSearchForm())
const page = ref(0)
const results = ref([])
const total = ref(0)
const totalPages = ref(1)
const loading = shallowRef(false)
const error = shallowRef(null)

const kindOptions = [
  { value: '', label: 'All' },
  { value: DocumentKind.DOCUMENT, label: 'Documents' },
  { value: DocumentKind.MEMORY, label: 'Memories' },
]

const selects = computed(() => [
  { field: 'scope', label: 'Scope', any: 'All scopes', width: 'w-[150px]', options: Object.values(Scope) },
  { field: 'author', label: 'Author', any: 'Anyone', width: 'w-[150px]', options: Object.values(Author) },
  ...(form.kind === DocumentKind.DOCUMENT
    ? []
    : [{ field: 'memoryType', label: 'Memory type', any: 'All types', width: 'w-[170px]', options: Object.values(MemoryType) }]),
])

const request = computed(() => toSearchRequest(form))
const hasActiveFilters = computed(() => {
  const empty = createSearchForm()
  return Object.keys(empty).some((field) => form[field] !== empty[field])
})
const resultLabel = computed(() => `${total.value} ${total.value === 1 ? 'result' : 'results'}`)
const pageLabel = computed(() => {
  if (!total.value) return '0 results'
  const first = page.value * PAGE_SIZE + 1
  const last = Math.min(total.value, first + PAGE_SIZE - 1)
  return `${first}–${last} of ${total.value} · page ${page.value + 1} of ${totalPages.value}`
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await searchDocuments(request.value, { page: page.value, size: PAGE_SIZE, sort: 'updatedAt,desc' })
    results.value = result.content
    total.value = result.totalElements ?? result.content.length
    totalPages.value = Math.max(1, result.totalPages ?? 1)
  } catch (e) {
    error.value = e
    results.value = []
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  Object.assign(form, createSearchForm())
}

function changePage(delta) {
  page.value = Math.min(Math.max(0, page.value + delta), totalPages.value - 1)
  window.scrollTo({ top: 0 })
}

watch(
  () => form.kind,
  (kind) => {
    if (kind === DocumentKind.DOCUMENT) form.memoryType = ''
  },
)

/** Only a list that can hold superseded entries needs the relations that mark them. */
watch(
  () => form.includeSuperseded,
  (included) => (form.includeRelations = included),
)

watch(
  () => [form.kind, form.scope, form.author, form.memoryType, form.projectKey, form.includeSuperseded],
  () => {
    page.value = 0
    load()
  },
)

watchDebounced(
  () => form.query,
  () => {
    page.value = 0
    load()
  },
  { debounce: 350 },
)

watch(page, load)

watch(
  () => props.applyFilters,
  (filters) => {
    if (!filters) return
    applyIncoming(filters)
  },
)

/** Replaces the filters with the ones another screen asked for; the watchers reload. */
function applyIncoming(filters) {
  Object.assign(form, createSearchForm(), filters)
  emit('applied')
}

onMounted(() => {
  loadProjects().catch(() => {})
  if (props.applyFilters) applyIncoming(props.applyFilters)
  else load()
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <div class="text-[10px] tracking-[0.1em] uppercase text-primary">{{ resultLabel }}</div>
      <h1 class="text-5xl leading-none tracking-[-0.02em]">Documents</h1>
    </div>

    <div class="flex flex-col gap-4 border-t-2 border-border pt-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="relative max-w-[460px] flex-[1_1_280px]">
          <Search class="pointer-events-none absolute top-2.5 left-2.5 size-4 text-neutral-700" aria-hidden="true" />
          <Input
            v-model="form.query"
            class="pl-9"
            placeholder="Full-text search: name, summary, content"
            aria-label="Full-text search"
          />
        </div>
        <Segmented v-model="form.kind" name="documents-kind" :options="kindOptions" />
      </div>

      <div class="flex flex-wrap items-end gap-4">
        <div v-for="select in selects" :key="select.field" class="flex flex-col gap-1" :class="select.width">
          <Label :for="`filter-${select.field}`" class="text-xs text-muted-foreground">{{ select.label }}</Label>
          <NativeSelect :id="`filter-${select.field}`" v-model="form[select.field]" class="w-full">
            <NativeSelectOption value="">{{ select.any }}</NativeSelectOption>
            <NativeSelectOption v-for="option in select.options" :key="option" :value="option">
              {{ formatEnum(option) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="flex w-[200px] flex-col gap-1">
          <Label for="filter-projectKey" class="text-xs text-muted-foreground">Project</Label>
          <NativeSelect id="filter-projectKey" v-model="form.projectKey" class="w-full">
            <NativeSelectOption value="">All projects</NativeSelectOption>
            <NativeSelectOption v-for="project in projects" :key="project.projectKey" :value="project.projectKey">
              {{ project.projectKey }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <label class="flex min-h-9 cursor-pointer items-center gap-2 text-sm">
          <input v-model="form.includeSuperseded" type="checkbox" class="m-0 size-4 accent-[var(--brand)]" />
          <span>Include superseded</span>
        </label>

        <Button v-if="hasActiveFilters" variant="ghost" class="whitespace-nowrap" @click="clearFilters">
          Clear filters
        </Button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <div class="flex min-w-[880px] flex-col">
        <div
          class="grid gap-4 border-b-2 border-border py-2"
          :class="ROW_COLUMNS"
        >
          <span class="micro-label">Name</span>
          <span class="micro-label">Kind</span>
          <span class="micro-label">Type</span>
          <span class="micro-label">Scope</span>
          <span class="micro-label">Author</span>
          <span class="micro-label">Updated</span>
        </div>

        <div v-if="loading" class="flex flex-col gap-3 py-3">
          <Skeleton v-for="index in 8" :key="index" class="h-11" />
        </div>

        <template v-else>
          <button
            v-for="document in results"
            :key="document.id"
            type="button"
            class="grid items-center gap-4 border-b border-border py-3 text-left text-sm hover:bg-foreground/4"
            :class="ROW_COLUMNS"
            @click="emit('open', document)"
          >
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="flex min-w-0 items-center gap-2">
                <span class="truncate font-semibold">{{ documentName(document) }}</span>
                <Badge v-if="isSuperseded(document)" variant="outline" class="shrink-0">Superseded</Badge>
              </span>
              <span class="truncate text-xs text-neutral-700">{{ document.summary || '—' }}</span>
            </span>
            <span><Badge :variant="kindVariant(document)">{{ kindLabel(document) }}</Badge></span>
            <span class="font-mono text-xs text-accent-700">{{ documentExtension(document) || '—' }}</span>
            <span class="flex min-w-0 flex-col gap-0.5">
              <span>{{ formatEnum(document.scope) }}</span>
              <span class="truncate font-mono text-[11px] text-neutral-700">{{ document.projectKey || '—' }}</span>
            </span>
            <span class="flex min-w-0 flex-col gap-0.5">
              <span class="truncate">{{ document.authorName || '—' }}</span>
              <span class="text-[11px] text-neutral-700">{{ formatEnum(document.author) }}</span>
            </span>
            <span class="text-neutral-700 tabular-nums">{{ formatDateTime(document.updatedAt) }}</span>
          </button>

          <div v-if="error" class="flex flex-col items-start gap-3 border-b border-border py-8">
            <span class="text-[15px] text-destructive">{{ error.message }}</span>
            <ul v-if="error.metadata && Object.keys(error.metadata).length" class="text-sm text-destructive">
              <li v-for="(message, field) in error.metadata" :key="field">{{ field }}: {{ message }}</li>
            </ul>
            <Button variant="outline" @click="load">Retry</Button>
          </div>

          <div v-else-if="!results.length" class="flex flex-col items-start gap-3 border-b border-border py-8">
            <span class="text-[15px]">No documents match these filters.</span>
            <Button variant="outline" @click="clearFilters">Clear filters</Button>
          </div>
        </template>
      </div>
    </div>

    <div class="flex items-center justify-between gap-4">
      <span class="text-[13px] text-neutral-700 tabular-nums">{{ pageLabel }}</span>
      <div class="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Previous page"
          :disabled="page === 0 || loading"
          @click="changePage(-1)"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Next page"
          :disabled="page >= totalPages - 1 || loading"
          @click="changePage(1)"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  </section>
</template>
