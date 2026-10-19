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
    class="flex w-full flex-col items-start gap-1 rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 p-5 text-left transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:ring-sky-reflection/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none active:translate-y-0"
  >
    <span class="w-full truncate font-medium text-deep-space-blue">{{ project.projectKey }}</span>
    <span class="text-xs text-muted-foreground">{{ documentsLabel }}</span>
  </button>
</template>
