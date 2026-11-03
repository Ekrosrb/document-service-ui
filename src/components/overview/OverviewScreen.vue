<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { DocumentKind, DocumentType, Scope, searchDocuments } from '@/api'
import { useWorkspace } from '@/composables/useWorkspace'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatEnum } from '@/lib/format'
import { TYPE_EXTENSIONS, documentExtension, documentName, kindLabel, kindVariant, scopeLine } from '@/lib/documentView'

/**
 * Workspace landing screen: the four headline numbers, the documents touched last, the
 * projects with their counts and the spread over document types.
 */
const emit = defineEmits(['go', 'open'])

const RECENT_SIZE = 6

const { projects, documentCount, memoryCount, trashCount, documentTypeCounts, memoryTypeCounts } = useWorkspace()

const recent = ref([])
const loadingRecent = shallowRef(true)
const recentError = shallowRef(null)

const stats = computed(() => [
  { label: 'Documents', value: documentCount.value, filters: { kind: DocumentKind.DOCUMENT } },
  { label: 'Memories', value: memoryCount.value, filters: { kind: DocumentKind.MEMORY } },
  { label: 'Projects', value: projects.value.length, filters: { scope: Scope.PROJECT } },
  { label: 'In trash', value: trashCount.value, view: 'trash' },
])

/**
 * Documents and memories get a table each, every one on its own scale, so a kind with
 * far fewer entries still shows which of its types are the common ones.
 */
const typeGroups = computed(() =>
  [
    { label: 'Documents by type', counts: documentTypeCounts.value },
    { label: 'Memories by type', counts: memoryTypeCounts.value },
  ].map((group) => {
    const rows = Object.keys(TYPE_EXTENSIONS).map((type) => ({ type, count: group.counts[type] ?? 0 }))
    const most = Math.max(1, ...rows.map((row) => row.count))
    return {
      label: group.label,
      total: rows.reduce((sum, row) => sum + row.count, 0),
      rows: rows.map((row) => ({ ...row, share: `${(row.count / most) * 100}%` })),
    }
  }),
)

async function loadRecent() {
  loadingRecent.value = true
  recentError.value = null
  try {
    const page = await searchDocuments({ includeSummary: true }, { page: 0, size: RECENT_SIZE, sort: 'updatedAt,desc' })
    recent.value = page.content
  } catch (e) {
    recentError.value = e
  } finally {
    loadingRecent.value = false
  }
}

function openStat(stat) {
  if (stat.view) emit('go', stat.view)
  else emit('go', 'documents', { filters: stat.filters })
}

onMounted(loadRecent)
</script>

<template>
  <section class="flex flex-col gap-8">
    <div class="flex flex-col gap-2">
      <div class="text-[10px] tracking-[0.1em] uppercase text-primary">Workspace</div>
      <h1 class="text-5xl leading-none tracking-[-0.02em]">Overview</h1>
    </div>

    <div data-test="stats" class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] border-y-2 border-border">
      <button
        v-for="stat in stats"
        :key="stat.label"
        type="button"
        class="flex flex-col gap-3 border-r border-border px-4 pt-4 pb-6 text-left last:border-r-0 hover:bg-foreground/4"
        @click="openStat(stat)"
      >
        <span class="micro-label">{{ stat.label }}</span>
        <span class="font-heading text-[56px] leading-none font-extrabold tracking-[-0.03em] tabular-nums">
          {{ stat.value ?? '—' }}
        </span>
      </button>
    </div>

    <div class="flex flex-wrap items-start gap-8">
      <div data-test="recent" class="flex min-w-0 flex-[2_1_520px] flex-col">
        <div class="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-border pb-3">
          <h2 class="text-xl whitespace-nowrap">Recently updated</h2>
          <Button variant="ghost" class="whitespace-nowrap" @click="emit('go', 'documents')">All documents →</Button>
        </div>

        <div v-if="loadingRecent" class="flex flex-col gap-3 py-3">
          <Skeleton v-for="index in RECENT_SIZE" :key="index" class="h-10" />
        </div>
        <div v-else-if="recentError" class="flex items-center gap-3 py-4 text-sm">
          <span class="text-destructive">{{ recentError.message }}</span>
          <Button variant="outline" size="sm" @click="loadRecent">Retry</Button>
        </div>
        <p v-else-if="!recent.length" class="border-b border-border py-6 text-sm text-muted-foreground">
          Nothing here yet.
        </p>
        <button
          v-for="document in recent"
          :key="document.id"
          type="button"
          data-test="recent-row"
          class="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-3 text-left hover:bg-foreground/4"
          @click="emit('open', document)"
        >
          <span class="font-mono text-xs text-accent-700">{{ documentExtension(document) || '—' }}</span>
          <span class="flex min-w-0 flex-col gap-0.5">
            <span class="truncate text-[15px] font-semibold">{{ documentName(document) }}</span>
            <span class="text-xs text-neutral-700">
              {{ scopeLine(document) }} · {{ document.authorName || formatEnum(document.author) }} ·
              {{ formatDateTime(document.updatedAt) }}
            </span>
          </span>
          <Badge :variant="kindVariant(document)">{{ kindLabel(document) }}</Badge>
        </button>
      </div>

      <div class="flex min-w-0 flex-[1_1_280px] flex-col gap-8">
        <div data-test="projects" class="flex flex-col">
          <div class="flex items-baseline justify-between border-b-2 border-border pb-3">
            <h2 class="text-xl">Projects</h2>
            <span class="micro-label">Docs</span>
          </div>
          <p v-if="!projects.length" class="border-b border-border py-3 text-sm text-muted-foreground">No projects.</p>
          <button
            v-for="project in projects"
            :key="project.projectKey"
            type="button"
            class="flex justify-between gap-3 border-b border-border py-3 text-sm hover:bg-foreground/4"
            @click="emit('go', 'documents', { filters: { projectKey: project.projectKey } })"
          >
            <span class="truncate font-mono text-[13px]">{{ project.projectKey }}</span>
            <span class="tabular-nums">{{ project.documents }}</span>
          </button>
        </div>

        <div v-for="group in typeGroups" :key="group.label" data-test="by-type" class="flex flex-col">
          <div class="flex items-baseline justify-between gap-3 border-b-2 border-border pb-3">
            <h2 class="text-xl">{{ group.label }}</h2>
            <span class="micro-label tabular-nums">{{ group.total }}</span>
          </div>
          <div
            v-for="entry in group.rows"
            :key="entry.type"
            data-test="type-row"
            class="grid grid-cols-[84px_minmax(0,1fr)_28px] items-center gap-3 border-b border-border py-2"
          >
            <span class="font-mono text-xs">
              {{ entry.type === DocumentType.CUSTOM ? 'custom' : TYPE_EXTENSIONS[entry.type] }}
            </span>
            <div class="h-2.5 bg-neutral-300/50">
              <div class="h-full bg-brand" :style="{ width: entry.share }"></div>
            </div>
            <span class="text-right text-[13px] tabular-nums" :class="{ 'text-neutral-500': !entry.count }">
              {{ entry.count }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
