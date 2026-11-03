<script setup>
import { computed, nextTick, shallowRef, watch } from 'vue'
import { Pencil, Plus, X } from '@lucide/vue'
import {
  DocumentKind,
  getDeletedDocument,
  getDocument,
  removeDocument,
  removeDocumentPermanently,
  removeDocumentRelation,
  restoreDocument,
} from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime, formatEnum } from '@/lib/format'
import { contentFilename, documentExtension, documentName, isSuperseded, kindLabel, kindVariant, scopeLine } from '@/lib/documentView'
import ConfirmDialog from './ConfirmDialog.vue'
import ContentFrame from './ContentFrame.vue'
import RelationDialog from './RelationDialog.vue'

/**
 * One document, read-only: its metadata, its content and both relation groups. A relation
 * opens the document it points at in the same screen; the back button then returns to it
 * and only leaves the screen once there is nothing left to go back to.
 */
const props = defineProps({
  /** The row the screen was opened with; `deleted` marks a document in trash. */
  document: { type: Object, required: true },
  backView: { type: String, default: 'documents' },
})

const emit = defineEmits(['back', 'changed', 'edit', 'gone', 'open'])

const BACK_LABELS = { overview: 'Overview', documents: 'Documents', trash: 'Trash' }
const CONTENT_SKELETON_WIDTHS = ['w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3', 'w-5/6', 'w-full', 'w-3/4']

const current = shallowRef(props.document)
const history = shallowRef([])
const loaded = shallowRef(null)
const error = shallowRef(null)
const actionError = shallowRef(null)
const pending = shallowRef(false)
const confirm = shallowRef(null)
const relationOpen = shallowRef(false)

const full = computed(() => (loaded.value?.id === current.value?.id ? loaded.value : null))
const shown = computed(() => full.value ?? current.value)
const loading = computed(() => !full.value && !error.value)
const deleted = computed(() => Boolean(shown.value?.deletedAt ?? current.value?.deleted))
const backLabel = computed(() => {
  const previous = history.value.at(-1)?.document
  return previous ? documentName(previous) : (BACK_LABELS[props.backView] ?? 'Back')
})

const metadata = computed(() => {
  const document = shown.value
  if (!document) return []
  return [
    ['ID', document.id],
    ['Kind', formatEnum(document.kind)],
    document.kind === DocumentKind.MEMORY && ['Memory type', formatEnum(document.memoryType)],
    ['Scope', formatEnum(document.scope)],
    document.projectKey && ['Project', document.projectKey],
    ['Author', `${document.authorName || '—'} · ${formatEnum(document.author)}`],
    ['Agent write', document.allowMcpWrite ? 'Allowed' : 'Not allowed'],
    ['Created', formatDateTime(document.createdAt)],
    ['Updated', formatDateTime(document.updatedAt)],
    document.deletedAt && ['Deleted', formatDateTime(document.deletedAt)],
  ]
    .filter(Boolean)
    .map(([key, value]) => ({ key, value }))
})

async function load() {
  const id = current.value?.id
  if (id == null) return
  error.value = null
  try {
    const fetch = current.value.deleted ? getDeletedDocument : getDocument
    const document = await fetch(id, { includeContent: true })
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
  if (!entry) {
    emit('back')
    return
  }
  history.value = history.value.slice(0, -1)
  loaded.value = entry.full
  current.value = entry.document
  await nextTick()
  window.scrollTo({ top: entry.scrollY })
}

/** Leaves the document after it is gone: back to the one before it, or off the screen. */
async function leave() {
  if (history.value.length) {
    loaded.value = null
    await back()
    await load()
  } else {
    emit('gone')
  }
}

async function run(action, { after = null } = {}) {
  pending.value = true
  actionError.value = null
  try {
    await action()
    confirm.value = null
    emit('changed')
    if (after) await after()
  } catch (e) {
    actionError.value = e
  } finally {
    pending.value = false
  }
}

function askTrash() {
  confirm.value = {
    title: `Move “${documentName(shown.value)}” to trash?`,
    description: 'You can restore it from Trash. Relations are hidden while it is deleted and restored with it.',
    label: 'Move to trash',
    run: () => run(() => removeDocument(shown.value.id), { after: leave }),
  }
}

function askPurge() {
  confirm.value = {
    title: `Delete “${documentName(shown.value)}” permanently?`,
    description: 'The document, its content and its relations are removed. This cannot be undone.',
    label: 'Delete permanently',
    run: () => run(() => removeDocumentPermanently(shown.value.id), { after: leave }),
  }
}

function askUnlink(group, relation) {
  confirm.value = {
    title: 'Remove relation?',
    description: `${formatEnum(relation.type)} → ${relation.name || `#${relation.id}`}`,
    label: 'Remove',
    run: () =>
      run(
        () => {
          const [documentId, relatedDocumentId] = group.outgoing
            ? [shown.value.id, relation.id]
            : [relation.id, shown.value.id]
          return removeDocumentRelation(documentId, relatedDocumentId)
        },
        { after: load },
      ),
  }
}

function restore() {
  run(
    async () => {
      await restoreDocument(current.value.id)
      current.value = { ...current.value, deleted: false }
    },
    { after: load },
  )
}

watch(
  () => props.document,
  (document) => {
    history.value = []
    loaded.value = null
    current.value = document
  },
)

watch(() => current.value?.id, load, { immediate: true })
</script>

<template>
  <section class="flex flex-col gap-6" :aria-busy="loading">
    <Button variant="ghost" class="self-start whitespace-nowrap" @click="back">← {{ backLabel }}</Button>

    <div
      v-if="deleted"
      class="flex flex-wrap items-center justify-between gap-4 bg-danger-100 px-4 py-3 text-danger-900"
    >
      <span class="text-sm">
        In trash<template v-if="shown.deletedAt"> since {{ formatDateTime(shown.deletedAt) }}</template>. Restore it to
        edit or link it.
      </span>
      <div class="flex gap-2">
        <Button variant="destructive-outline" class="whitespace-nowrap" :disabled="pending" @click="askPurge">
          Delete permanently
        </Button>
        <Button :disabled="pending" @click="restore">Restore</Button>
      </div>
    </div>

    <div class="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
      <div class="flex min-w-0 flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="kindVariant(shown)">{{ kindLabel(shown) }}</Badge>
          <Badge variant="outline" class="font-mono">{{ documentExtension(shown) || formatEnum(shown.type) }}</Badge>
          <Badge variant="neutral">{{ scopeLine(shown) }}</Badge>
          <Badge v-if="isSuperseded(shown)" variant="outline">Superseded</Badge>
        </div>
        <h1 class="text-4xl leading-[1.05] tracking-[-0.02em] text-pretty">{{ documentName(shown) }}</h1>
      </div>

      <div v-if="!deleted" class="flex gap-2">
        <Button variant="destructive-outline" class="whitespace-nowrap" :disabled="pending" @click="askTrash">
          Move to trash
        </Button>
        <Button class="min-w-[140px] justify-between gap-4" :disabled="!full" @click="emit('edit', full)">
          <span>Edit</span>
          <Pencil />
        </Button>
      </div>
    </div>

    <p v-if="actionError" class="text-sm text-destructive">{{ actionError.message }}</p>

    <div class="flex flex-wrap items-start gap-8">
      <div class="flex min-w-0 flex-[3_1_520px] flex-col gap-6">
        <div class="flex flex-col gap-2">
          <div class="micro-label">Summary</div>
          <p v-if="shown.summary" class="max-w-[72ch] text-[17px] leading-[1.5] text-pretty">{{ shown.summary }}</p>
          <div v-else-if="loading" class="flex max-w-[72ch] flex-col gap-2">
            <Skeleton class="h-4 w-full" />
            <Skeleton class="h-4 w-2/3" />
          </div>
          <p v-else class="text-sm text-muted-foreground">No summary.</p>
        </div>

        <div v-if="error" class="flex items-center gap-3 text-sm">
          <span class="text-destructive">{{ error.message }}</span>
          <Button variant="outline" size="sm" @click="load">Retry</Button>
        </div>
        <div v-else-if="loading" class="flex flex-col gap-2.5 border-2 border-border p-4">
          <Skeleton v-for="(width, index) in CONTENT_SKELETON_WIDTHS" :key="index" class="h-3.5" :class="width" />
        </div>
        <ContentFrame
          v-else-if="full.content"
          :key="full.id"
          :content="full.content"
          :type="full.type"
          :filename="contentFilename(full)"
          :name="String(full.id)"
        />
        <p v-else class="text-sm text-muted-foreground">No content.</p>
      </div>

      <aside class="flex min-w-0 flex-[1_1_280px] flex-col gap-8">
        <div class="flex flex-col">
          <div class="micro-label border-b-2 border-border pb-2">Metadata</div>
          <div
            v-for="row in metadata"
            :key="row.key"
            class="grid grid-cols-[104px_minmax(0,1fr)] gap-3 border-b border-border py-2 text-sm"
          >
            <span class="text-[13px] text-neutral-700">{{ row.key }}</span>
            <span class="break-words">{{ row.value }}</span>
          </div>
        </div>

        <div v-for="group in [
          { label: 'Relations', relations: shown.relations, outgoing: true },
          { label: 'Referenced by', relations: shown.referencedBy, outgoing: false },
        ]" :key="group.label" class="flex flex-col">
          <div class="flex items-center justify-between border-b-2 border-border pb-2">
            <span class="micro-label">{{ group.label }}</span>
            <Button
              v-if="group.outgoing && !deleted"
              variant="ghost"
              size="xs"
              class="whitespace-nowrap"
              :disabled="!full"
              @click="relationOpen = true"
            >
              <Plus />
              Add
            </Button>
          </div>

          <div v-if="!group.relations && loading" class="py-2">
            <Skeleton class="h-4 w-48" />
          </div>
          <p v-else-if="!group.relations?.length" class="border-b border-border py-3 text-[13px] text-neutral-700">
            {{ group.outgoing ? 'No outgoing relations.' : 'Not referenced by other documents.' }}
          </p>
          <div
            v-for="relation in group.relations ?? []"
            :key="`${relation.type}-${relation.id}`"
            class="grid grid-cols-[104px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-2 text-sm"
          >
            <span class="text-[11px] tracking-[0.06em] uppercase text-accent-700">{{ formatEnum(relation.type) }}</span>
            <button
              type="button"
              class="min-w-0 truncate text-left underline underline-offset-[3px] hover:text-primary"
              @click="openRelation(relation)"
            >
              {{ relation.name || `#${relation.id}` }}
            </button>
            <Button
              v-if="!deleted"
              variant="ghost"
              size="icon-xs"
              class="text-neutral-700 hover:bg-destructive/10 hover:text-destructive"
              :aria-label="`Remove relation to ${relation.name || relation.id}`"
              :disabled="pending"
              @click="askUnlink(group, relation)"
            >
              <X />
            </Button>
          </div>
        </div>
      </aside>
    </div>

    <ConfirmDialog
      :open="confirm !== null"
      :title="confirm?.title ?? ''"
      :description="confirm?.description ?? ''"
      :confirm-label="confirm?.label ?? 'Confirm'"
      :pending="pending"
      :error="actionError"
      @update:open="confirm = null"
      @confirm="confirm?.run()"
    />

    <RelationDialog v-if="full" v-model:open="relationOpen" :document="full" @added="load" />
  </section>
</template>
