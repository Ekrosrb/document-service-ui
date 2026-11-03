<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import { getDeletedDocuments, removeDocumentPermanently, restoreDocument } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateTime } from '@/lib/format'
import { documentName, kindLabel, kindVariant, scopeLine } from '@/lib/documentView'
import ConfirmDialog from '@/components/document/ConfirmDialog.vue'

/** Soft-deleted documents, with restore and permanent delete. */
const emit = defineEmits(['changed', 'open'])

const PAGE_SIZE = 20
const ROW_COLUMNS = 'grid-cols-[minmax(0,1fr)_120px_170px_120px_300px]'

const rows = ref([])
const total = ref(0)
const totalPages = ref(1)
const page = ref(0)
const loading = shallowRef(false)
const error = shallowRef(null)
const actionError = shallowRef(null)
const pending = shallowRef(false)
const confirm = shallowRef(null)

const kicker = computed(() => `${total.value} deleted`)
const pageLabel = computed(() => {
  if (!total.value) return '0 documents'
  const first = page.value * PAGE_SIZE + 1
  const last = Math.min(total.value, first + PAGE_SIZE - 1)
  return `${first}–${last} of ${total.value} · page ${page.value + 1} of ${totalPages.value}`
})

async function load() {
  loading.value = true
  error.value = null
  try {
    const result = await getDeletedDocuments({ page: page.value, size: PAGE_SIZE, sort: 'deletedAt,desc' })
    rows.value = result.content
    total.value = result.totalElements ?? result.content.length
    totalPages.value = Math.max(1, result.totalPages ?? 1)
    if (page.value > 0 && !result.content.length) {
      page.value -= 1
      await load()
    }
  } catch (e) {
    error.value = e
    rows.value = []
  } finally {
    loading.value = false
  }
}

async function run(action) {
  pending.value = true
  actionError.value = null
  try {
    await action()
    confirm.value = null
    emit('changed')
    await load()
  } catch (e) {
    actionError.value = e
  } finally {
    pending.value = false
  }
}

function askPurge(document) {
  confirm.value = {
    title: `Delete “${documentName(document)}” permanently?`,
    description: 'The document, its content and its relations are removed. This cannot be undone.',
    label: 'Delete permanently',
    run: () => run(() => removeDocumentPermanently(document.id)),
  }
}

function changePage(delta) {
  page.value = Math.min(Math.max(0, page.value + delta), totalPages.value - 1)
  load()
  window.scrollTo({ top: 0 })
}

onMounted(load)
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <div class="text-[10px] tracking-[0.1em] uppercase text-primary">{{ kicker }}</div>
      <h1 class="text-5xl leading-none tracking-[-0.02em]">Trash</h1>
    </div>

    <p v-if="actionError" class="text-sm text-destructive">{{ actionError.message }}</p>

    <div class="overflow-x-auto">
      <div class="flex min-w-[760px] flex-col border-t-2 border-border">
        <div class="grid gap-4 border-b-2 border-border py-2" :class="ROW_COLUMNS">
          <span class="micro-label">Name</span>
          <span class="micro-label">Kind</span>
          <span class="micro-label">Scope</span>
          <span class="micro-label">Deleted</span>
          <span></span>
        </div>

        <div v-if="loading" class="flex flex-col gap-3 py-3">
          <Skeleton v-for="index in 4" :key="index" class="h-11" />
        </div>

        <template v-else>
          <div
            v-for="document in rows"
            :key="document.id"
            class="grid items-center gap-4 border-b border-border py-3 text-sm"
            :class="ROW_COLUMNS"
          >
            <button
              type="button"
              class="flex min-w-0 flex-col gap-0.5 text-left"
              @click="emit('open', document)"
            >
              <span class="truncate font-semibold underline underline-offset-[3px]">{{ documentName(document) }}</span>
              <span class="truncate text-xs text-neutral-700">{{ document.summary || '—' }}</span>
            </button>
            <span><Badge :variant="kindVariant(document)">{{ kindLabel(document) }}</Badge></span>
            <span class="truncate">{{ scopeLine(document) }}</span>
            <span class="text-neutral-700 tabular-nums">{{ formatDateTime(document.deletedAt) }}</span>
            <div class="flex justify-end gap-2">
              <Button variant="destructive-ghost" class="whitespace-nowrap" :disabled="pending" @click="askPurge(document)">
                Delete permanently
              </Button>
              <Button variant="outline" :disabled="pending" @click="run(() => restoreDocument(document.id))">
                Restore
              </Button>
            </div>
          </div>

          <div v-if="error" class="flex flex-col items-start gap-3 border-b border-border py-8">
            <span class="text-[15px] text-destructive">{{ error.message }}</span>
            <Button variant="outline" @click="load">Retry</Button>
          </div>
          <p v-else-if="!rows.length" class="border-b border-border py-8 text-[15px]">Trash is empty.</p>
        </template>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-between gap-4">
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
  </section>
</template>
