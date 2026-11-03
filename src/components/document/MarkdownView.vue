<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/lib/markdown'

/** Renders a Markdown document as sanitized HTML. */
const props = defineProps({
  text: { type: String, default: '' },
})

const html = computed(() => renderMarkdown(props.text))
</script>

<template>
  <div class="markdown-body text-sm text-foreground" v-html="html" />
</template>
