<script setup>
import { computed } from 'vue'
import { highlight } from '@/lib/highlight'

/** Shows text as a code block, syntax highlighted when a highlight.js language is given. */
const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: null },
})

const html = computed(() => highlight(props.code, props.language))
</script>

<template>
  <pre class="hljs font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground"><code v-html="html" /></pre>
</template>
