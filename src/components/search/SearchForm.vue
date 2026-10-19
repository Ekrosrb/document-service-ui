<script setup>
import { reactive, ref, watch } from 'vue'
import { Search } from '@lucide/vue'
import { Author, DocumentKind, MemoryType, Scope } from '@/api'
import { formatEnum } from '@/lib/format'
import { createSearchForm, toSearchRequest, validateSearchRequest } from '@/validation/documentSearch'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

defineProps({
  projectKeys: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['search'])

const selectFields = [
  { field: 'kind', label: 'Kind', options: Object.values(DocumentKind) },
  { field: 'scope', label: 'Scope', options: Object.values(Scope) },
  { field: 'author', label: 'Author', options: Object.values(Author) },
  { field: 'memoryType', label: 'Memory type', options: Object.values(MemoryType) },
]

const includeFields = [
  { field: 'includeSummary', label: 'Summary' },
  { field: 'includeSuperseded', label: 'Superseded entries' },
]

const form = reactive(createSearchForm())
const errors = ref({})

watch(
  () => form.kind,
  (kind) => {
    if (kind === DocumentKind.DOCUMENT) form.memoryType = ''
  },
)

watch(form, () => (errors.value = {}), { deep: true })

function submit() {
  const request = toSearchRequest(form)
  errors.value = validateSearchRequest(request)
  if (Object.keys(errors.value).length) return
  emit('search', request)
}

function reset() {
  Object.assign(form, createSearchForm())
}
</script>

<template>
  <form class="flex flex-col gap-5 rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 p-5" novalidate @submit.prevent="submit">
    <div class="flex flex-col gap-2">
      <Label for="search-query">Search query</Label>
      <div class="flex gap-2">
        <Input id="search-query" v-model="form.query" placeholder='Words, "a phrase", OR, -excluded' />
        <Button type="submit" :disabled="loading">
          <Search />
          Search
        </Button>
        <Button type="button" variant="outline" @click="reset">Reset</Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="select in selectFields" :key="select.field" class="flex flex-col gap-2">
        <Label :for="`search-${select.field}`">{{ select.label }}</Label>
        <NativeSelect
          :id="`search-${select.field}`"
          v-model="form[select.field]"
          class="w-full"
          :disabled="select.field === 'memoryType' && form.kind === DocumentKind.DOCUMENT"
          :aria-invalid="Boolean(errors[select.field])"
        >
          <NativeSelectOption value="">Any</NativeSelectOption>
          <NativeSelectOption v-for="option in select.options" :key="option" :value="option">
            {{ formatEnum(option) }}
          </NativeSelectOption>
        </NativeSelect>
        <p v-if="errors[select.field]" class="text-xs text-destructive">{{ errors[select.field] }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="flex flex-col gap-2">
        <Label for="search-projectKey">Project key</Label>
        <Input id="search-projectKey" v-model="form.projectKey" list="search-project-keys" placeholder="Any project" />
        <datalist id="search-project-keys">
          <option v-for="key in projectKeys" :key="key" :value="key" />
        </datalist>
      </div>
      <div class="flex flex-col gap-2">
        <Label for="search-authorName">Author name</Label>
        <Input id="search-authorName" v-model="form.authorName" placeholder="Any author" />
      </div>
    </div>

    <fieldset class="flex flex-wrap items-center gap-x-6 gap-y-3">
      <legend class="mb-3 text-sm font-medium">Include in results</legend>
      <div v-for="include in includeFields" :key="include.field" class="flex items-center gap-2">
        <Checkbox :id="`search-${include.field}`" v-model="form[include.field]" />
        <Label :for="`search-${include.field}`" class="font-normal">{{ include.label }}</Label>
      </div>
    </fieldset>

    <p v-if="errors.form" class="text-sm text-destructive">{{ errors.form }}</p>
  </form>
</template>
