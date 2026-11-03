<script setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { RelationType, createDocumentRelation, searchDocuments } from '@/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { formatEnum } from '@/lib/format'
import { documentName, kindLabel } from '@/lib/documentView'

/**
 * Links the shown document to another one. The target is picked by searching, because the
 * API has no endpoint that lists every document.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  document: { type: Object, required: true },
})

const emit = defineEmits(['update:open', 'added'])

const type = ref(RelationType.RELATED_TO)
const query = ref('')
const candidates = ref([])
const targetId = ref(null)
const searching = shallowRef(false)
const saving = shallowRef(false)
const error = shallowRef(null)

const linkedIds = computed(() => new Set((props.document.relations ?? []).map((relation) => relation.id)))
const canAdd = computed(() => targetId.value !== null && !saving.value)

async function search() {
  const text = query.value.trim()
  if (!text) {
    candidates.value = []
    return
  }
  searching.value = true
  error.value = null
  try {
    const page = await searchDocuments({ query: text, includeSummary: true }, { page: 0, size: 10, sort: 'updatedAt,desc' })
    candidates.value = page.content.filter((item) => item.id !== props.document.id && !linkedIds.value.has(item.id))
  } catch (e) {
    error.value = e
  } finally {
    searching.value = false
  }
}

async function add() {
  saving.value = true
  error.value = null
  try {
    await createDocumentRelation({ documentId: props.document.id, relatedDocumentId: targetId.value, type: type.value })
    emit('added')
    emit('update:open', false)
  } catch (e) {
    error.value = e
  } finally {
    saving.value = false
  }
}

watchDebounced(query, search, { debounce: 350 })

watch(
  () => props.open,
  (open) => {
    if (!open) return
    type.value = RelationType.RELATED_TO
    query.value = ''
    candidates.value = []
    targetId.value = null
    error.value = null
  },
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[480px]" :show-close-button="false">
      <DialogHeader>
        <DialogTitle>Add relation</DialogTitle>
        <DialogDescription>From “{{ documentName(document) }}”</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <Label for="relation-type" class="text-xs text-muted-foreground">Relation type</Label>
          <NativeSelect id="relation-type" v-model="type" class="w-full">
            <NativeSelectOption v-for="option in Object.values(RelationType)" :key="option" :value="option">
              {{ formatEnum(option) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="flex flex-col gap-1">
          <Label for="relation-search" class="text-xs text-muted-foreground">Related document</Label>
          <Input id="relation-search" v-model="query" placeholder="Search by name, summary or content" />
        </div>

        <div class="flex max-h-56 flex-col overflow-y-auto border border-border">
          <p v-if="searching" class="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
          <p v-else-if="!query.trim()" class="px-3 py-2 text-sm text-muted-foreground">Type to find a document.</p>
          <p v-else-if="!candidates.length" class="px-3 py-2 text-sm text-muted-foreground">Nothing found.</p>
          <button
            v-for="candidate in candidates"
            :key="candidate.id"
            type="button"
            class="flex flex-col gap-0.5 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-foreground/7"
            :class="{ 'bg-primary text-primary-foreground hover:bg-primary': candidate.id === targetId }"
            :aria-pressed="candidate.id === targetId"
            @click="targetId = candidate.id"
          >
            <span class="truncate font-semibold">{{ documentName(candidate) }} (#{{ candidate.id }})</span>
            <span class="truncate text-xs opacity-80">{{ kindLabel(candidate) }} · {{ candidate.summary || '—' }}</span>
          </button>
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error.message }}</p>
      </div>

      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="emit('update:open', false)">Cancel</Button>
        <Button :disabled="!canAdd" @click="add">{{ saving ? 'Adding…' : 'Add relation' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
