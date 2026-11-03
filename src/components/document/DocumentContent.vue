<script setup>
import { computed, ref, watch } from 'vue'
import { CodeXml, Eye } from '@lucide/vue'
import { DocumentType } from '@/api'
import { Button } from '@/components/ui/button'
import { languageForType } from '@/lib/highlight'
import CodeBlock from './CodeBlock.vue'
import HtmlFrame from './HtmlFrame.vue'
import MarkdownView from './MarkdownView.vue'
import XmlView from './XmlView.vue'

const renderedTypes = [DocumentType.XML, DocumentType.MARKDOWN, DocumentType.HTML]

/**
 * Shows a document's content the way its type is meant to be read: rendered for XML,
 * Markdown and HTML, syntax highlighted for JSON, CSS and TOON, plain text otherwise.
 * Rendered types get a toggle that switches to the raw source.
 */
const props = defineProps({
  content: { type: String, default: '' },
  type: { type: String, default: DocumentType.TEXT },
})

const raw = ref(false)

const renderable = computed(() => renderedTypes.includes(props.type))
const rendered = computed(() => renderable.value && !raw.value)
const language = computed(() => languageForType(props.type))

watch(() => [props.content, props.type], () => (raw.value = false))
</script>

<template>
  <div class="flex flex-col items-stretch gap-3">
    <Button
      v-if="renderable"
      variant="outline"
      size="sm"
      class="sticky top-0 z-10 self-end bg-card shadow-sm dark:bg-card"
      :aria-pressed="raw"
      @click="raw = !raw"
    >
      <CodeXml v-if="rendered" />
      <Eye v-else />
      {{ rendered ? 'Raw' : 'Rendered' }}
    </Button>

    <HtmlFrame v-if="rendered && type === DocumentType.HTML" :html="content" />
    <XmlView v-else-if="rendered && type === DocumentType.XML" :text="content" />
    <MarkdownView v-else-if="rendered && type === DocumentType.MARKDOWN" :text="content" />
    <CodeBlock v-else :code="content" :language="language" />
  </div>
</template>
