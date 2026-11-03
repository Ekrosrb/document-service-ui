<script setup>
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { Check } from '@lucide/vue'
import {
  Author,
  DocumentKind,
  DocumentType,
  MemoryType,
  Scope,
  createDocument,
  getDocument,
  updateDocument,
} from '@/api'
import { useWorkspace } from '@/composables/useWorkspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Segmented } from '@/components/ui/segmented'
import { Textarea } from '@/components/ui/textarea'
import { formatEnum } from '@/lib/format'
import { TYPE_EXTENSIONS, documentName, lineCount, slugify } from '@/lib/documentView'
import {
  MAX_LENGTHS,
  createDraftForm,
  createEditForm,
  toCreateRequest,
  toUpdateRequest,
  validateCreateForm,
  validateEditForm,
} from '@/validation/documentEdit'

/**
 * Creates a document or edits an existing one. Kind, scope and author are set at creation
 * and shown read-only afterwards, because the API does not accept them in an update.
 */
const props = defineProps({
  /** The document being edited, or null to create a new one. */
  document: { type: Object, default: null },
})

const emit = defineEmits(['cancel', 'saved'])

const { projects, loadProjects } = useWorkspace()

const creating = computed(() => props.document === null)
const form = reactive(creating.value ? createDraftForm() : createEditForm(props.document))
const errors = ref({})
const error = shallowRef(null)
const saving = shallowRef(false)

const scope = computed(() => (creating.value ? form.scope : props.document.scope))
const kind = computed(() => (creating.value ? form.kind : props.document.kind))

const kindOptions = Object.values(DocumentKind).map((value) => ({ value, label: formatEnum(value) }))
const scopeOptions = Object.values(Scope).map((value) => ({ value, label: formatEnum(value) }))
const authorOptions = Object.values(Author).map((value) => ({ value, label: formatEnum(value) }))
const mcpOptions = [
  { value: false, label: 'Not allowed' },
  { value: true, label: 'Allowed' },
]

const lockedRows = computed(() => [
  { key: 'Kind', value: formatEnum(props.document?.kind) },
  { key: 'Scope', value: formatEnum(props.document?.scope) },
  { key: 'Author', value: formatEnum(props.document?.author) },
])

const kicker = computed(() => (creating.value ? 'New' : `Edit · #${props.document.id}`))
const heading = computed(() => (creating.value ? 'Create document' : documentName(props.document)))
const saveLabel = computed(() => (creating.value ? 'Create' : 'Save changes'))
const draftFilename = computed(() => {
  const extension = form.type === DocumentType.CUSTOM ? form.customExtension || '' : (TYPE_EXTENSIONS[form.type] ?? '')
  return (slugify(form.name) || 'untitled') + extension
})

async function save() {
  errors.value = creating.value ? validateCreateForm(form) : validateEditForm(form, { scope: scope.value })
  if (Object.keys(errors.value).length) return

  saving.value = true
  error.value = null
  try {
    let id = props.document?.id
    if (creating.value) {
      ;({ id } = await createDocument(toCreateRequest(form)))
    } else {
      const request = toUpdateRequest(form, props.document)
      if (Object.keys(request).length) await updateDocument(id, request)
    }
    emit('saved', await getDocument(id, { includeContent: true }))
  } catch (e) {
    error.value = e
  } finally {
    saving.value = false
  }
}

onMounted(() => loadProjects().catch(() => {}))
</script>

<template>
  <section class="flex flex-col gap-6">
    <Button variant="ghost" class="self-start whitespace-nowrap" @click="emit('cancel')">← Cancel</Button>

    <div class="flex flex-wrap items-end justify-between gap-4 border-b-2 border-border pb-4">
      <div class="flex flex-col gap-2">
        <div class="text-[10px] tracking-[0.1em] uppercase text-primary">{{ kicker }}</div>
        <h1 class="text-4xl leading-[1.05] tracking-[-0.02em]">{{ heading }}</h1>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="saving" @click="emit('cancel')">Cancel</Button>
        <Button class="min-w-[160px] justify-between gap-4" :disabled="saving" @click="save">
          <span>{{ saving ? 'Saving…' : saveLabel }}</span>
          <Check />
        </Button>
      </div>
    </div>

    <p v-if="error" class="text-sm text-destructive">{{ error.message }}</p>

    <div class="flex flex-wrap items-start gap-8">
      <div class="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
        <div class="micro-label border-b-2 border-border pb-2">Classification</div>

        <template v-if="creating">
          <div class="flex flex-col gap-1">
            <Label class="text-xs text-muted-foreground">
              Kind <span class="text-destructive" title="Required">*</span>
            </Label>
            <Segmented v-model="form.kind" name="draft-kind" :options="kindOptions" class="self-start" />
            <p v-if="errors.kind" class="text-xs text-destructive">{{ errors.kind }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <Label class="text-xs text-muted-foreground">
              Scope <span class="text-destructive" title="Required">*</span>
            </Label>
            <Segmented v-model="form.scope" name="draft-scope" :options="scopeOptions" class="self-start" />
            <p v-if="errors.scope" class="text-xs text-destructive">{{ errors.scope }}</p>
          </div>
          <div class="flex flex-col gap-1">
            <Label class="text-xs text-muted-foreground">
              Author <span class="text-destructive" title="Required">*</span>
            </Label>
            <Segmented v-model="form.author" name="draft-author" :options="authorOptions" class="self-start" />
            <p v-if="errors.author" class="text-xs text-destructive">{{ errors.author }}</p>
          </div>
        </template>

        <div v-else class="flex flex-col">
          <div
            v-for="row in lockedRows"
            :key="row.key"
            class="grid grid-cols-[96px_minmax(0,1fr)] gap-3 border-b border-border py-2 text-sm"
          >
            <span class="text-[13px] text-neutral-700">{{ row.key }}</span>
            <span>{{ row.value }}</span>
          </div>
          <span class="pt-2 text-xs text-neutral-700">Kind, scope and author are set at creation.</span>
        </div>

        <div v-if="scope === Scope.PROJECT" class="flex flex-col gap-1">
          <Label for="editor-projectKey" class="text-xs text-muted-foreground">
            Project key <span class="text-destructive" title="Required">*</span>
          </Label>
          <Input
            id="editor-projectKey"
            v-model="form.projectKey"
            list="editor-project-keys"
            class="font-mono"
            placeholder="e.g. payments-api"
            :maxlength="MAX_LENGTHS.projectKey"
            :aria-invalid="Boolean(errors.projectKey)"
          />
          <datalist id="editor-project-keys">
            <option v-for="project in projects" :key="project.projectKey" :value="project.projectKey" />
          </datalist>
          <p v-if="errors.projectKey" class="text-xs text-destructive">{{ errors.projectKey }}</p>
        </div>

        <div v-if="kind === DocumentKind.MEMORY" class="flex flex-col gap-1">
          <Label for="editor-memoryType" class="text-xs text-muted-foreground">Memory type</Label>
          <NativeSelect id="editor-memoryType" v-model="form.memoryType" class="w-full">
            <NativeSelectOption v-if="!form.memoryType" value="" disabled>—</NativeSelectOption>
            <NativeSelectOption v-for="option in Object.values(MemoryType)" :key="option" :value="option">
              {{ formatEnum(option) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div class="flex flex-col gap-1">
          <Label for="editor-type" class="text-xs text-muted-foreground">Content type</Label>
          <NativeSelect id="editor-type" v-model="form.type" class="w-full">
            <NativeSelectOption v-for="option in Object.values(DocumentType)" :key="option" :value="option">
              {{ formatEnum(option) }}{{ TYPE_EXTENSIONS[option] ? `  ${TYPE_EXTENSIONS[option]}` : '' }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div v-if="form.type === DocumentType.CUSTOM" class="flex flex-col gap-1">
          <Label for="editor-customExtension" class="text-xs text-muted-foreground">
            Custom extension <span class="text-destructive" title="Required">*</span>
          </Label>
          <Input
            id="editor-customExtension"
            v-model="form.customExtension"
            class="font-mono"
            placeholder=".env"
            :maxlength="MAX_LENGTHS.customExtension"
            :aria-invalid="Boolean(errors.customExtension)"
          />
          <p v-if="errors.customExtension" class="text-xs text-destructive">{{ errors.customExtension }}</p>
        </div>

        <div class="micro-label border-b-2 border-border pt-4 pb-2">Details</div>

        <div class="flex flex-col gap-1">
          <Label for="editor-name" class="text-xs text-muted-foreground">Name</Label>
          <Input
            id="editor-name"
            v-model="form.name"
            placeholder="Optional"
            :maxlength="MAX_LENGTHS.name"
            :aria-invalid="Boolean(errors.name)"
          />
          <p v-if="errors.name" class="text-xs text-destructive">{{ errors.name }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <Label for="editor-authorName" class="text-xs text-muted-foreground">Author name</Label>
          <Input
            id="editor-authorName"
            v-model="form.authorName"
            placeholder="Optional"
            :maxlength="MAX_LENGTHS.authorName"
            :aria-invalid="Boolean(errors.authorName)"
          />
          <p v-if="errors.authorName" class="text-xs text-destructive">{{ errors.authorName }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <Label for="editor-summary" class="flex justify-between text-xs text-muted-foreground">
            <span>Summary <span class="text-destructive" title="Required">*</span></span>
            <span class="tabular-nums">{{ form.summary.length }} / {{ MAX_LENGTHS.summary }}</span>
          </Label>
          <Textarea
            id="editor-summary"
            v-model="form.summary"
            class="min-h-24"
            placeholder="One or two sentences. Search and agents read this first."
            :maxlength="MAX_LENGTHS.summary"
            aria-required="true"
            :aria-invalid="Boolean(errors.summary)"
          />
          <p v-if="errors.summary" class="text-xs text-destructive">{{ errors.summary }}</p>
        </div>

        <div class="flex flex-col gap-1">
          <Label class="text-xs text-muted-foreground">Agent (MCP) write access</Label>
          <Segmented v-model="form.allowMcpWrite" name="editor-mcp" :options="mcpOptions" class="self-start" />
        </div>
      </div>

      <div class="flex min-w-0 flex-[3_1_520px] flex-col gap-2">
        <div class="flex flex-col border-2 border-border">
          <div class="flex items-center justify-between gap-3 border-b-2 border-border px-3 py-2 text-xs text-neutral-700">
            <span class="font-mono">{{ draftFilename }}</span>
            <span>Content <span class="text-destructive">*</span> · {{ lineCount(form.content) }} lines</span>
          </div>
          <Textarea
            id="editor-content"
            v-model="form.content"
            class="min-h-[560px] resize-y rounded-none border-0 bg-muted p-4 font-mono text-[13px] leading-[1.65] hover:border-0 focus-visible:border-0"
            spellcheck="false"
            placeholder="Start writing…"
            aria-label="Content"
            aria-required="true"
            :aria-invalid="Boolean(errors.content)"
          />
        </div>
        <p v-if="errors.content" class="text-xs text-destructive">{{ errors.content }}</p>
      </div>
    </div>
  </section>
</template>
