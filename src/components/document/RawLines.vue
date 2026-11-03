<script setup>
import { computed } from 'vue'

/** Shows content as plain numbered lines, the way a file viewer does. */
const props = defineProps({
  content: { type: String, default: '' },
})

const lines = computed(() => props.content.split('\n'))
</script>

<template>
  <div class="font-mono text-[13px] leading-[1.65]">
    <div v-for="(line, index) in lines" :key="index" class="grid grid-cols-[44px_minmax(0,1fr)] gap-4 pr-4">
      <span class="text-right text-neutral-500 select-none tabular-nums">{{ index + 1 }}</span>
      <span class="break-words whitespace-pre-wrap">{{ line || ' ' }}</span>
    </div>
  </div>
</template>
