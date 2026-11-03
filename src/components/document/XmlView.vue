<script setup>
import { computed } from 'vue'
import { parseXml } from '@/lib/xml'
import XmlNode from './XmlNode.vue'

/** Renders an XML document as a collapsible tree, or the parser error when it is malformed. */
const props = defineProps({
  text: { type: String, default: '' },
})

const parsed = computed(() => parseXml(props.text))
</script>

<template>
  <div class="hljs font-mono text-sm leading-relaxed text-foreground">
    <p v-if="parsed.error" class="font-sans whitespace-pre-wrap text-destructive">{{ parsed.error }}</p>
    <template v-else>
      <XmlNode v-for="(node, index) in parsed.nodes" :key="index" :node="node" />
    </template>
  </div>
</template>
