<script setup>
import { computed } from 'vue'

const props = defineProps({
  project: { type: Object, required: true },
})

const documentsLabel = computed(() => `${props.project.documents} ${props.project.documents === 1 ? 'document' : 'documents'}`)
</script>

<template>
  <button
    type="button"
    class="flex w-full flex-col items-start gap-1 rounded-lg border border-border bg-card p-4 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:border-slate-blue hover:bg-charcoal-blue/40 hover:shadow-lg hover:shadow-black/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0"
  >
    <span class="w-full truncate font-medium text-lavender-light">{{ project.projectKey }}</span>
    <span class="text-xs text-steel-gray">{{ documentsLabel }}</span>
  </button>
</template>
