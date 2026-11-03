<script setup>
import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue'
import { ArrowLeft, Eye, EyeOff, Pencil, Save, Trash2, Undo2, X } from '@lucide/vue'
import { DocumentKind, createDocument, getDocument, removeDocument, removeDocumentRelation, updateDocument } from '@/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import ConfirmDialog from './ConfirmDialog.vue'
import DocumentContent from './DocumentContent.vue'
import { formatDateTime, formatEnum } from '@/lib/format'
import {
  CREATE_ENUM_FIELDS,
  EDITABLE_ENUM_FIELDS,
  MAX_LENGTHS,
  createDraftForm,
  createEditForm,
  toCreateRequest,
  toUpdateRequest,
  validateCreateForm,
  validateEditForm,
} from '@/validation/documentEdit'

/**
 * Read and edit view of one document. `document` is the search result the view was opened
 * with, shown right away while the full document loads. Clicking a relation opens that
 * document in the same view, and the back button returns to the previous one. Edit mode
 * saves the changed fields, removes relations and deletes the document. With `creating`
 * and no `document` the view is an empty draft that the first save posts as a new one.
 */
const props = defineProps({
  document: { type: Object, default: null },
  creating: { type: Boolean, default: false },
})

const emit = defineEmits(['created', 'deleted', 'exit', 'updated'])

const badgeFields = ['kind', 'scope', 'type', 'author', 'memoryType']
const contentSkeletonWidths = ['w-11/12', 'w-full', 'w-4/5', 'w-full', 'w-2/3', 'w-0', 'w-full', 'w-5/6', 'w-full', 'w-3/4', 'w-1/2']
const enumFieldLabels = { type: 'Type', memoryType: 'Memory type' }
const createFieldLabels = { kind: 'Kind', scope: 'Scope', author: 'Author' }
const inlineTextFields = [
  { field: 'projectKey', label: 'Project key' },
  { field: 'authorName', label: 'Author name' },
]

const current = shallowRef(props.document)
const history = shallowRef([])
const loaded = shallowRef(null)
const error = shallowRef(null)

const mode = shallowRef('read')
const form = reactive(createDraftForm())
const formSource = shallowRef(null)
const errors = ref({})
const actionError = shallowRef(null)
const saving = shallowRef(false)
const removingRelation = shallowRef(null)
const deleting = shallowRef(false)
const confirmDelete = shallowRef(false)
const pendingRelation = shallowRef(null)
const contentPreview = shallowRef(false)

const full = computed(() => (loaded.value?.id === current.value?.id ? loaded.value : null))
const shown = computed(() => full.value ?? current.value)
const loading = computed(() => current.value !== null && !full.value && !error.value)
const editing = computed(() => mode.value === 'edit')
const drafting = computed(() => props.creating && props.document === null)
const dirty = computed(() => {
  if (drafting.value) {
    const draft = createDraftForm()
    return Object.keys(draft).some((field) => form[field] !== draft[field])
  }
  return formSource.value !== null && Object.keys(toUpdateRequest(form, formSource.value)).length > 0
})

const relationGroups = computed(() => [
  { label: 'Links to', relations: shown.value?.relations, outgoing: true },
  { label: 'Referenced by', relations: shown.value?.referencedBy, outgoing: false },
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

function resetForm(document) {
  Object.assign(form, createEditForm(document))
  formSource.value = document
  errors.value = {}
  actionError.value = null
}

function openRelation(relation) {
  if (relation.id === current.value?.id) return
  if (dirty.value) {
    pendingRelation.value = relation
    return
  }
  history.value = [...history.value, { document: shown.value, full: full.value, scrollY: window.scrollY }]
  current.value = { id: relation.id, name: relation.name }
  mode.value = 'read'
  window.scrollTo({ top: 0 })
}

function discardAndOpenRelation() {
  const relation = pendingRelation.value
  pendingRelation.value = null
  if (!relation) return
  resetForm(formSource.value)
  openRelation(relation)
}

/** Returns to the previous document; `refresh` reloads it instead of reusing the cached one. */
async function back({ refresh = false } = {}) {
  const entry = history.value.at(-1)
  if (!entry) return
  history.value = history.value.slice(0, -1)
  if (entry.full && !refresh) loaded.value = entry.full
  current.value = entry.document
  await nextTick()
  window.scrollTo({ top: refresh ? 0 : entry.scrollY })
}

function discard() {
  if (drafting.value) {
    Object.assign(form, createDraftForm())
    errors.value = {}
    return
  }
  resetForm(formSource.value)
}

/** Posts the draft, then shows the created document through the `created` event. */
async function createNew() {
  errors.value = validateCreateForm(form)
  if (Object.keys(errors.value).length) return

  saving.value = true
  actionError.value = null
  try {
    const { id } = await createDocument(toCreateRequest(form))
    const saved = await getDocument(id, { includeContent: true })
    loaded.value = saved
    resetForm(saved)
    mode.value = 'read'
    emit('created', saved)
  } catch (e) {
    actionError.value = e
  } finally {
    saving.value = false
  }
}

async function save() {
  if (drafting.value) return createNew()

  errors.value = validateEditForm(form)
  if (Object.keys(errors.value).length) return
  const document = formSource.value
  const request = toUpdateRequest(form, document)
  if (!Object.keys(request).length) return

  saving.value = true
  actionError.value = null
  try {
    await updateDocument(document.id, request)
    const saved = await getDocument(document.id, { includeContent: true })
    if (current.value?.id === saved.id) loaded.value = saved
    resetForm(saved)
    mode.value = 'read'
    emit('updated', saved)
  } catch (e) {
    actionError.value = e
  } finally {
    saving.value = false
  }
}

async function removeRelation(group, relation) {
  const [documentId, relatedDocumentId] = group.outgoing ? [shown.value.id, relation.id] : [relation.id, shown.value.id]
  removingRelation.value = `${group.label}-${relation.id}`
  actionError.value = null
  try {
    await removeDocumentRelation(documentId, relatedDocumentId)
    await load()
  } catch (e) {
    actionError.value = e
  } finally {
    removingRelation.value = null
  }
}

/** Soft-deletes the shown document, then returns to the previous one or to the search tab. */
async function remove() {
  const id = shown.value.id
  deleting.value = true
  actionError.value = null
  try {
    await removeDocument(id)
    confirmDelete.value = false
    mode.value = 'read'
    emit('deleted', id)
    if (history.value.length) {
      loaded.value = null
      await back({ refresh: true })
    } else {
      emit('exit')
    }
  } catch (e) {
    actionError.value = e
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.document,
  (document) => {
    history.value = []
    current.value = document
    mode.value = 'read'
    window.scrollTo({ top: 0 })
  },
)

watch(
  () => props.creating,
  (creating) => {
    if (!creating) return
    history.value = []
    current.value = null
    loaded.value = null
    error.value = null
    formSource.value = null
    errors.value = {}
    actionError.value = null
    Object.assign(form, createDraftForm())
    mode.value = 'edit'
    window.scrollTo({ top: 0 })
  },
  { immediate: true },
)

watch([() => current.value?.id, mode], () => (contentPreview.value = false))

watch(() => current.value?.id, load, { immediate: true })

watch(full, (document) => {
  if (document && formSource.value?.id !== document.id) resetForm(document)
})
</script>

<template>
  <p v-if="!shown && !drafting" class="py-12 text-center text-sm text-muted-foreground">
    Open a document from the Search tab to see it here.
  </p>

  <div v-else class="flex flex-col gap-6" :aria-busy="loading">
    <section class="flex flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10">
      <div class="flex items-start gap-3">
        <Button v-if="history.length" variant="ghost" size="icon-sm" aria-label="Back to previous document" @click="back()">
          <ArrowLeft />
        </Button>
        <h2 class="mr-auto text-2xl font-semibold text-foreground">
          {{ drafting ? 'New document' : shown.name || 'Untitled' }}
        </h2>

        <div class="flex shrink-0 items-center gap-2">
          <Badge v-if="dirty" variant="outline" class="text-muted-foreground">Unsaved changes</Badge>
          <template v-if="!drafting">
            <Button :variant="editing ? 'ghost' : 'secondary'" size="sm" :aria-pressed="!editing" @click="mode = 'read'">
              Read
            </Button>
            <Button :variant="editing ? 'secondary' : 'ghost'" size="sm" :aria-pressed="editing" :disabled="!full" @click="mode = 'edit'">
              <Pencil />
              Edit
            </Button>
          </template>
        </div>
      </div>

      <div v-if="editing" class="flex flex-wrap items-center gap-2">
        <Button :variant="dirty ? 'default' : 'outline'" size="sm" :disabled="!dirty || saving" @click="save">
          <Save />
          {{ saving ? 'Saving…' : 'Save' }}
        </Button>
        <Button variant="outline" size="sm" :disabled="!dirty || saving" @click="discard">
          <Undo2 />
          Discard
        </Button>
        <Button v-if="drafting" variant="ghost" size="sm" class="ml-auto" :disabled="saving" @click="emit('exit')">
          Cancel
        </Button>
        <Button v-else variant="destructive" size="sm" class="ml-auto" :disabled="saving" @click="confirmDelete = true">
          <Trash2 />
          Delete
        </Button>
      </div>

      <p v-if="actionError" class="text-sm text-destructive">{{ actionError.message }}</p>

      <div v-if="!drafting" class="flex flex-wrap gap-2">
        <template v-for="field in badgeFields" :key="field">
          <Badge v-if="shown[field]" :variant="field === 'kind' ? 'secondary' : 'outline'">
            {{ formatEnum(shown[field]) }}
            <template v-if="field === 'type' && shown.customExtension">({{ shown.customExtension }})</template>
          </Badge>
        </template>
      </div>

      <template v-if="editing">
        <div v-if="drafting" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div v-for="(label, field) in createFieldLabels" :key="field" class="flex flex-col gap-2">
            <Label :for="`document-${field}`">
              {{ label }}
              <span class="text-destructive" title="Required">*</span>
            </Label>
            <NativeSelect
              :id="`document-${field}`"
              v-model="form[field]"
              class="w-full"
              aria-required="true"
              :aria-invalid="Boolean(errors[field])"
            >
              <NativeSelectOption value="" disabled>Choose…</NativeSelectOption>
              <NativeSelectOption v-for="option in CREATE_ENUM_FIELDS[field]" :key="option" :value="option">
                {{ formatEnum(option) }}
              </NativeSelectOption>
            </NativeSelect>
            <p v-if="errors[field]" class="text-xs text-destructive">{{ errors[field] }}</p>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="document-name">Name</Label>
          <Input id="document-name" v-model="form.name" :maxlength="MAX_LENGTHS.name" :aria-invalid="Boolean(errors.name)" />
          <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div v-for="(label, field) in enumFieldLabels" :key="field" class="flex flex-col gap-2">
            <Label :for="`document-${field}`">{{ label }}</Label>
            <NativeSelect
              :id="`document-${field}`"
              v-model="form[field]"
              class="w-full"
              :disabled="field === 'memoryType' && (drafting ? form.kind : shown.kind) !== DocumentKind.MEMORY"
            >
              <NativeSelectOption v-if="!form[field]" value="" disabled>—</NativeSelectOption>
              <NativeSelectOption v-for="option in EDITABLE_ENUM_FIELDS[field]" :key="option" :value="option">
                {{ formatEnum(option) }}
              </NativeSelectOption>
            </NativeSelect>
          </div>

          <div v-for="text in inlineTextFields" :key="text.field" class="flex flex-col gap-2">
            <Label :for="`document-${text.field}`">{{ text.label }}</Label>
            <Input
              :id="`document-${text.field}`"
              v-model="form[text.field]"
              :maxlength="MAX_LENGTHS[text.field]"
              :aria-invalid="Boolean(errors[text.field])"
            />
            <p v-if="errors[text.field]" class="text-xs text-destructive">{{ errors[text.field] }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="document-customExtension">Custom extension</Label>
            <Input
              id="document-customExtension"
              v-model="form.customExtension"
              :maxlength="MAX_LENGTHS.customExtension"
              :aria-invalid="Boolean(errors.customExtension)"
            />
            <p v-if="errors.customExtension" class="text-xs text-destructive">{{ errors.customExtension }}</p>
          </div>
          <div class="flex h-8 items-center gap-2 self-end">
            <Checkbox id="document-allowMcpWrite" v-model="form.allowMcpWrite" />
            <Label for="document-allowMcpWrite" class="font-normal">MCP write allowed</Label>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="document-summary">
            Summary
            <span v-if="drafting" class="text-destructive" title="Required">*</span>
          </Label>
          <Textarea
            id="document-summary"
            v-model="form.summary"
            class="min-h-24"
            :maxlength="MAX_LENGTHS.summary"
            :aria-required="drafting"
            :aria-invalid="Boolean(errors.summary)"
          />
          <p v-if="errors.summary" class="text-xs text-destructive">{{ errors.summary }}</p>
        </div>
      </template>

      <template v-else>
        <p v-if="shown.summary" class="max-w-4xl text-[0.9375rem] leading-relaxed text-foreground">{{ shown.summary }}</p>
        <div v-else-if="loading" class="flex max-w-4xl flex-col gap-2 py-0.5">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </div>
      </template>

      <dl
        v-if="!drafting"
        class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm sm:grid-cols-[max-content_1fr_max-content_1fr]"
      >
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

      <div v-if="!drafting" class="flex flex-col gap-1 text-sm">
        <div v-for="group in relationGroups" :key="group.label" class="flex min-h-5 flex-wrap items-center gap-2">
          <span class="font-medium text-muted-foreground">{{ group.label }}:</span>
          <template v-if="group.relations?.length">
            <span
              v-for="relation in group.relations"
              :key="`${relation.type}-${relation.id}`"
              class="flex max-w-full items-center gap-1"
            >
              <Badge
                as="button"
                type="button"
                variant="outline"
                class="h-auto max-w-full cursor-pointer rounded-md text-left whitespace-normal hover:bg-muted"
                @click="openRelation(relation)"
              >
                {{ formatEnum(relation.type) }}: {{ relation.name || 'Untitled' }} #{{ relation.id }}
              </Badge>
              <Button
                v-if="editing"
                variant="ghost"
                size="icon-xs"
                :aria-label="`Remove relation to ${relation.name || relation.id}`"
                :disabled="removingRelation !== null"
                @click="removeRelation(group, relation)"
              >
                <X />
              </Button>
            </span>
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
      <div v-else-if="editing" class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <Label for="document-content">
            Content
            <span v-if="drafting" class="text-destructive" title="Required">*</span>
          </Label>
          <Button
            variant="ghost"
            size="sm"
            class="ml-auto"
            :disabled="!form.type"
            :aria-pressed="contentPreview"
            @click="contentPreview = !contentPreview"
          >
            <EyeOff v-if="contentPreview" />
            <Eye v-else />
            {{ contentPreview ? 'Edit content' : `Preview as ${formatEnum(form.type)}` }}
          </Button>
        </div>

        <template v-if="contentPreview">
          <DocumentContent
            v-if="form.content"
            :key="form.type"
            class="rounded-2xl bg-muted/50 p-5"
            :content="form.content"
            :type="form.type"
          />
          <p v-else class="text-sm text-muted-foreground">Nothing to preview.</p>
        </template>
        <Textarea
          v-else
          id="document-content"
          v-model="form.content"
          class="min-h-96 font-mono text-xs"
          spellcheck="false"
          :aria-required="drafting"
          :aria-invalid="Boolean(errors.content)"
        />
        <p v-if="errors.content" class="text-xs text-destructive">{{ errors.content }}</p>
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

    <ConfirmDialog
      v-if="!drafting"
      v-model:open="confirmDelete"
      :title="`Delete ${shown.name || 'document ' + shown.id}?`"
      description="The document is soft-deleted and its relations are dropped. Only a person can restore it."
      confirm-label="Delete"
      :pending="deleting"
      :error="actionError"
      @confirm="remove"
    />

    <ConfirmDialog
      :open="pendingRelation !== null"
      title="Discard unsaved changes?"
      description="Opening a related document drops the edits you have not saved."
      confirm-label="Discard and open"
      @update:open="pendingRelation = null"
      @confirm="discardAndOpenRelation"
    />
  </div>
</template>
