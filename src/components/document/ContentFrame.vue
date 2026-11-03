<script setup>
import { computed, ref } from 'vue'
import { DocumentType } from '@/api'
import { Segmented } from '@/components/ui/segmented'
import { contentSize, lineCount } from '@/lib/documentView'
import DocumentContent from './DocumentContent.vue'
import RawLines from './RawLines.vue'

/**
 * The bordered content frame: the file name and size on top, then the content either
 * rendered for its type or as plain numbered lines.
 */
const props = defineProps({
  content: { type: String, default: '' },
  type: { type: String, default: DocumentType.TEXT },
  filename: { type: String, default: '' },
  name: { type: String, required: true },
})

const modes = [
  { value: 'rendered', label: 'Rendered' },
  { value: 'lines', label: 'Lines' },
]

const mode = ref('rendered')

const lines = computed(() => lineCount(props.content))
const size = computed(() => contentSize(props.content))
</script>

<template>
  <div class="flex flex-col border-2 border-border">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-border px-3 py-2 text-xs text-neutral-700">
      <span class="font-mono">{{ filename }}</span>
      <div class="flex items-center gap-3">
        <span>{{ lines }} lines · {{ size }}</span>
        <Segmented v-model="mode" :name="`content-mode-${name}`" :options="modes" class="text-[11px]" />
      </div>
    </div>
    <div class="overflow-auto bg-muted px-0 py-3">
      <RawLines v-if="mode === 'lines'" :content="content" />
      <DocumentContent v-else class="px-4" :content="content" :type="type" />
    </div>
  </div>
</template>
