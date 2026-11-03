<script setup>
import { computed, nextTick, shallowRef, watch } from 'vue'
import { ArrowLeft } from '@lucide/vue'
import { getDocument } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import DocumentContent from './DocumentContent.vue'
import { formatDateTime, formatEnum } from '@/lib/format'

/**
 * Read-only full page view of one document. `document` is the search result the view was
 * opened with, shown right away while the full document loads. Clicking a relation opens
 * that document in the same view, and the back button returns to the previous one.
 */
const props = defineProps({
  document: { type: Object, default: null },
})

const badgeFields = ['kind', 'scope', 'type', 'author', 'memoryType']
const contentSkeletonWidths = ['w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3', 'w-0', 'w-full', 'w-5/6', 'w-full', 'w-3/4', 'w-1/2']

const current = shallowRef(props.document)
const history = shallowRef([])
const loaded = shallowRef(null)
const error = shallowRef(null)

const full = computed(() => (loaded.value?.id === current.value?.id ? loaded.value : null))
const shown = computed(() => full.value ?? current.value)
const loading = computed(() => current.value !== null && !full.value && !error.value)

const relationGroups = computed(() => [
  { label: 'Links to', relations: shown.value?.relations },
  { label: 'Referenced by', relations: shown.value?.referencedBy },
])

async function load() {
  const id = current.value?.id
  if (id == null) return
  error.value = null
  try {
    const document = await getDocument(id, { includeContent: true })
    if (id === current.value?.id) loaded.value = document
  } catch (e) {
    if (id === current.value?.id) error.value = e
  }
}

function openRelation(relation) {
  if (relation.id === current.value?.id) return
  history.value = [...history.value, { document: shown.value, full: full.value, scrollY: window.scrollY }]
  current.value = { id: relation.id, name: relation.name }
  window.scrollTo({ top: 0 })
}

async function back() {
  const entry = history.value.at(-1)
  if (!entry) return
  history.value = history.value.slice(0, -1)
  if (entry.full) loaded.value = entry.full
  current.value = entry.document
  await nextTick()
  window.scrollTo({ top: entry.scrollY })
}

watch(
  () => props.document,
  (document) => {
    history.value = []
    current.value = document
    window.scrollTo({ top: 0 })
  },
)

watch(() => current.value?.id, load, { immediate: true })
</script>

<template>
  <p v-if="!shown" class="py-12 text-center text-sm text-muted-foreground">
    Open a document from the Search tab to see it here.
  </p>

  <div v-else class="flex flex-col gap-6" :aria-busy="loading">
    <section class="flex flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div class="flex items-start gap-3">
        <Button v-if="history.length" variant="ghost" size="icon-sm" aria-label="Back to previous document" @click="back">
          <ArrowLeft />
        </Button>
        <h2 class="text-2xl font-semibold text-foreground">{{ shown.name || 'Untitled' }}</h2>
      </div>

      <div class="flex flex-wrap gap-2">
        <template v-for="field in badgeFields" :key="field">
          <Badge v-if="shown[field]" :variant="field === 'kind' ? 'secondary' : 'outline'">
            {{ formatEnum(shown[field]) }}
            <template v-if="field === 'type' && shown.customExtension">({{ shown.customExtension }})</template>
          </Badge>
        </template>
      </div>

      <p v-if="shown.summary" class="max-w-4xl text-[0.9375rem] leading-relaxed text-foreground">{{ shown.summary }}</p>
      <div v-else-if="loading" class="flex max-w-4xl flex-col gap-2 py-0.5">
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-4 w-2/3" />
      </div>

      <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr_max-content_1fr]">
        <dt class="font-medium text-muted-foreground">ID</dt>
        <dd class="tabular-nums">{{ shown.id }}</dd>
        <dt class="font-medium text-muted-foreground">Project</dt>
        <dd>{{ shown.projectKey || '—' }}</dd>
        <dt class="font-medium text-muted-foreground">Author name</dt>
        <dd class="break-all">{{ shown.authorName || '—' }}</dd>
        <dt class="font-medium text-muted-foreground">MCP write</dt>
        <dd>{{ shown.allowMcpWrite ? 'Allowed' : 'Not allowed' }}</dd>
        <dt class="font-medium text-muted-foreground">Created</dt>
        <dd>{{ formatDateTime(shown.createdAt) }}</dd>
        <dt class="font-medium text-muted-foreground">Updated</dt>
        <dd>{{ formatDateTime(shown.updatedAt) }}</dd>
        <dt class="font-medium text-muted-foreground">Deleted</dt>
        <dd>{{ shown.deletedAt ? formatDateTime(shown.deletedAt) : '—' }}</dd>
        <dt class="font-medium text-muted-foreground">Custom extension</dt>
        <dd>{{ shown.customExtension || '—' }}</dd>
      </dl>

      <div class="flex flex-col gap-1 text-sm">
        <div v-for="group in relationGroups" :key="group.label" class="flex min-h-5 flex-wrap items-center gap-2">
          <span class="font-medium text-muted-foreground">{{ group.label }}:</span>
          <template v-if="group.relations?.length">
            <Badge
              v-for="relation in group.relations"
              :key="`${relation.type}-${relation.id}`"
              as="button"
              type="button"
              variant="outline"
              class="h-auto max-w-full cursor-pointer rounded-md text-left whitespace-normal hover:bg-muted"
              @click="openRelation(relation)"
            >
              {{ formatEnum(relation.type) }}: {{ relation.name || 'Untitled' }} #{{ relation.id }}
            </Badge>
          </template>
          <Skeleton v-else-if="!group.relations && loading" class="h-4 w-48" />
          <span v-else class="text-muted-foreground">none</span>
        </div>
      </div>
    </section>

    <section class="rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div v-if="error" class="flex items-center justify-center gap-3 text-sm">
        <span class="text-destructive">{{ error.message }}</span>
        <Button variant="outline" size="sm" @click="load">Retry</Button>
      </div>
      <div v-else-if="loading" class="flex flex-col gap-2.5">
        <Skeleton v-for="(width, index) in contentSkeletonWidths" :key="index" class="h-3.5" :class="width" />
      </div>
      <DocumentContent
        v-else-if="full.content"
        :key="full.id"
        class="animate-in duration-300 fade-in"
        :content="full.content"
        :type="full.type"
      />
      <p v-else class="text-sm text-muted-foreground">No content.</p>
    </section>
  </div>
</template>
