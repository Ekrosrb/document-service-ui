<script setup>
import { computed, shallowRef, useTemplateRef, watch } from 'vue'
import { X } from '@lucide/vue'
import { getDocument } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatEnum } from '@/lib/format'

/**
 * Shows one document with its content. `document` is the search result, shown right away
 * while the full document loads.
 */
const props = defineProps({
  document: { type: Object, required: true },
})

const emit = defineEmits(['close'])

const badgeFields = ['kind', 'scope', 'type', 'author', 'memoryType']
const contentSkeletonWidths = ['w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3', 'w-0', 'w-full', 'w-5/6', 'w-full', 'w-3/4', 'w-1/2']

const loaded = shallowRef(null)
const error = shallowRef(null)
const contentArea = useTemplateRef('contentArea')

const full = computed(() => (loaded.value?.id === props.document.id ? loaded.value : null))
const shown = computed(() => full.value ?? props.document)
const loading = computed(() => !full.value && !error.value)

const relationGroups = computed(() => [
  { label: 'Links to', relations: shown.value.relations },
  { label: 'Referenced by', relations: shown.value.referencedBy },
])

async function load() {
  const id = props.document.id
  error.value = null
  try {
    const document = await getDocument(id, { includeContent: true })
    if (id === props.document.id) loaded.value = document
  } catch (e) {
    if (id === props.document.id) error.value = e
  }
}

watch(
  () => props.document.id,
  () => {
    if (contentArea.value) contentArea.value.scrollTop = 0
    load()
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="flex h-[calc(100vh-6.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10"
    :aria-label="shown.name || `Document ${shown.id}`"
    :aria-busy="loading"
  >
    <header class="flex flex-col gap-4 p-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-lg font-semibold text-foreground">{{ shown.name || 'Untitled' }}</h2>
        <Button variant="ghost" size="icon-sm" aria-label="Close document" @click="emit('close')">
          <X />
        </Button>
      </div>

      <div class="flex flex-wrap gap-2">
        <template v-for="field in badgeFields" :key="field">
          <Badge v-if="shown[field]" :variant="field === 'kind' ? 'secondary' : 'outline'">
            {{ formatEnum(shown[field]) }}
            <template v-if="field === 'type' && shown.customExtension">({{ shown.customExtension }})</template>
          </Badge>
        </template>
      </div>

      <p v-if="shown.summary" class="text-[0.9375rem] leading-relaxed text-foreground">{{ shown.summary }}</p>
      <div v-else-if="loading" class="flex flex-col gap-2 py-0.5">
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
      </dl>

      <div class="flex flex-col gap-1 text-sm">
        <div v-for="group in relationGroups" :key="group.label" class="flex min-h-5 flex-wrap items-center gap-2">
          <span class="font-medium text-muted-foreground">{{ group.label }}:</span>
          <template v-if="group.relations?.length">
            <Badge
              v-for="relation in group.relations"
              :key="`${relation.type}-${relation.id}`"
              variant="outline"
              class="h-auto max-w-full rounded-md whitespace-normal"
            >
              {{ formatEnum(relation.type) }}: {{ relation.name || 'Untitled' }} #{{ relation.id }}
            </Badge>
          </template>
          <Skeleton v-else-if="!group.relations && loading" class="h-4 w-48" />
          <span v-else class="text-muted-foreground">none</span>
        </div>
      </div>
    </header>

    <div ref="contentArea" class="mx-5 mb-5 min-h-0 flex-1 overflow-auto rounded-2xl bg-muted/50 p-5">
      <div v-if="error" class="flex items-center justify-center gap-3 text-sm">
        <span class="text-destructive">{{ error.message }}</span>
        <Button variant="outline" size="sm" @click="load">Retry</Button>
      </div>
      <div v-else-if="loading" class="flex flex-col gap-2.5">
        <Skeleton v-for="(width, index) in contentSkeletonWidths" :key="index" class="h-3.5" :class="width" />
      </div>
      <pre
        v-else-if="full.content"
        :key="full.id"
        class="animate-in font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground duration-300 fade-in"
      >{{ full.content }}</pre>
      <p v-else class="text-sm text-muted-foreground">No content.</p>
    </div>
  </section>
</template>
