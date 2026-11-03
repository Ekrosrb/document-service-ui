<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useWorkspace } from '@/composables/useWorkspace'
import AppHeader from '@/components/layout/AppHeader.vue'
import OverviewScreen from '@/components/overview/OverviewScreen.vue'
import DocumentsScreen from '@/components/documents/DocumentsScreen.vue'
import DocumentDetail from '@/components/document/DocumentDetail.vue'
import DocumentEditor from '@/components/document/DocumentEditor.vue'
import TrashScreen from '@/components/trash/TrashScreen.vue'

const { trashCount, refresh, loadTrashCount } = useWorkspace()

const view = ref('overview')
const selected = shallowRef(null)
const editing = shallowRef(null)
/** The list the detail and editor screens go back to. */
const origin = ref('documents')
/** Filters the documents screen should apply the next time it is shown. */
const pendingFilters = shallowRef(null)

/** A deleted document belongs to Trash, so the header marks that link instead. */
const navView = computed(() => (view.value === 'detail' && selected.value?.deleted ? 'trash' : view.value))

function go(next, { filters = null } = {}) {
  if (filters) pendingFilters.value = filters
  view.value = next
  window.scrollTo({ top: 0 })
}

function openDocument(document, { deleted = false } = {}) {
  if (view.value !== 'detail') origin.value = deleted ? 'trash' : view.value
  selected.value = { ...document, deleted }
  go('detail')
}

function createDocument() {
  editing.value = null
  if (view.value !== 'edit') origin.value = view.value === 'detail' ? 'documents' : view.value
  go('edit')
}

function editDocument(document) {
  editing.value = document
  go('edit')
}

/** Shows the document a save produced and refreshes the counts it changed. */
function showSaved(document) {
  selected.value = { ...document, deleted: false }
  refresh({ force: true })
  go('detail')
}

function leaveEditor() {
  go(editing.value ? 'detail' : origin.value)
}

function afterTrashChange() {
  refresh({ force: true })
}

onMounted(() => {
  refresh()
  loadTrashCount()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background text-foreground">
    <AppHeader :view="navView" :trash-count="trashCount" @go="go" @create="createDocument" />

    <main class="w-full max-w-[1320px] flex-1 px-6 py-8">
      <OverviewScreen
        v-if="view === 'overview'"
        @open="openDocument"
        @go="(next, options) => go(next, options)"
      />

      <DocumentsScreen
        v-else-if="view === 'documents'"
        :apply-filters="pendingFilters"
        @open="openDocument"
        @applied="pendingFilters = null"
      />

      <DocumentDetail
        v-else-if="view === 'detail'"
        :document="selected"
        :back-view="origin"
        @back="go(origin)"
        @open="openDocument"
        @edit="editDocument"
        @changed="afterTrashChange"
        @gone="go(origin)"
      />

      <DocumentEditor
        v-else-if="view === 'edit'"
        :document="editing"
        @saved="showSaved"
        @cancel="leaveEditor"
      />

      <TrashScreen
        v-else-if="view === 'trash'"
        @open="(document) => openDocument(document, { deleted: true })"
        @changed="afterTrashChange"
      />
    </main>
  </div>
</template>
