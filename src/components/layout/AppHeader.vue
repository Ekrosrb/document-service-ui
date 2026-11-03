<script setup>
import { Moon, Plus, Sun } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { Button } from '@/components/ui/button'

/** Top navigation: brand, the three places to go, the theme toggle and "New document". */
const props = defineProps({
  view: { type: String, required: true },
  trashCount: { type: Number, default: null },
})

const emit = defineEmits(['go', 'create'])

const { dark, toggle } = useTheme()

const links = [
  { view: 'overview', label: 'Overview', matches: ['overview'] },
  { view: 'documents', label: 'Documents', matches: ['documents', 'detail', 'edit'] },
  { view: 'trash', label: 'Trash', matches: ['trash'] },
]

function isCurrent(link) {
  return link.matches.includes(props.view)
}
</script>

<template>
  <header class="flex flex-wrap items-center gap-6 border-b-2 border-border px-6 py-3">
    <div class="mr-auto flex items-center gap-2 font-heading text-lg font-extrabold whitespace-nowrap">
      <span class="inline-block size-3.5 bg-primary" aria-hidden="true"></span>
      <span>HL Documents</span>
    </div>

    <nav class="flex items-center gap-6" aria-label="Main">
      <a
        v-for="link in links"
        :key="link.view"
        href="#"
        class="text-sm whitespace-nowrap hover:text-primary"
        :class="isCurrent(link) ? 'text-primary' : 'text-foreground'"
        :aria-current="isCurrent(link) ? 'page' : undefined"
        @click.prevent="emit('go', link.view)"
      >
        {{ link.label }}<template v-if="link.view === 'trash' && trashCount !== null"> ({{ trashCount }})</template>
      </a>
    </nav>

    <Button
      variant="outline"
      size="icon"
      :title="dark ? 'Switch to light theme' : 'Switch to dark theme'"
      :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'"
      :aria-pressed="dark"
      @click="toggle"
    >
      <Sun v-if="dark" />
      <Moon v-else />
    </Button>

    <Button class="gap-4 whitespace-nowrap" @click="emit('create')">
      <span>New document</span>
      <Plus />
    </Button>
  </header>
</template>
