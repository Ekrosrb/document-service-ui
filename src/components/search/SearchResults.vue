<script setup>
import { computed, reactive } from 'vue'
import { ChevronRight, PanelRightOpen } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatEnum } from '@/lib/format'

const props = defineProps({
  documents: { type: Array, required: true },
  compact: { type: Boolean, default: false },
  openId: { type: Number, default: null },
})

const emit = defineEmits(['open'])

const enumColumns = [
  { field: 'kind', label: 'Kind' },
  { field: 'scope', label: 'Scope' },
  { field: 'type', label: 'Type' },
  { field: 'author', label: 'Author' },
  { field: 'memoryType', label: 'Memory type' },
]

const columnCount = computed(() => (props.compact ? 1 : enumColumns.length + 5))

const expanded = reactive(new Set())

function isExpanded(id) {
  return !props.compact && expanded.has(id)
}

function onRowClick(document) {
  if (props.compact) emit('open', document)
  else toggle(document.id)
}

function toggle(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}
</script>

<template>
  <div class="rounded-3xl bg-card shadow-sm ring-1 ring-foreground/5 dark:ring-foreground/10 px-3 py-2">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead v-if="!compact" class="w-10"><span class="sr-only">Details</span></TableHead>
          <TableHead :class="{ 'min-w-72': !compact }">Name</TableHead>
          <template v-if="!compact">
            <TableHead v-for="column in enumColumns" :key="column.field">{{ column.label }}</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
          </template>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-for="document in documents" :key="document.id">
          <TableRow
            class="cursor-pointer"
            :class="{ 'border-b-0': isExpanded(document.id), 'bg-secondary': document.id === openId }"
            :aria-current="document.id === openId || undefined"
            :tabindex="compact ? 0 : undefined"
            @click="onRowClick(document)"
            @keydown.enter="compact && emit('open', document)"
          >
            <TableCell v-if="!compact">
              <button
                type="button"
                class="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                :aria-expanded="isExpanded(document.id)"
                :aria-controls="`document-details-${document.id}`"
                :aria-label="`Details of ${document.name || 'document ' + document.id}`"
                @click.stop="toggle(document.id)"
              >
                <ChevronRight class="size-4 transition-transform duration-300" :class="{ 'rotate-90': isExpanded(document.id) }" />
              </button>
            </TableCell>
            <TableCell class="font-medium whitespace-normal text-foreground">
              {{ document.name || 'Untitled' }}
              <span v-if="compact" class="mt-1 block text-xs font-normal text-muted-foreground">
                {{ formatEnum(document.kind) }}<template v-if="document.projectKey"> · {{ document.projectKey }}</template>
              </span>
            </TableCell>
            <template v-if="!compact">
              <TableCell v-for="column in enumColumns" :key="column.field">
                <Badge v-if="document[column.field]" :variant="column.field === 'kind' ? 'secondary' : 'outline'">
                  {{ formatEnum(document[column.field]) }}
                  <template v-if="column.field === 'type' && document.customExtension">({{ document.customExtension }})</template>
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell>{{ document.projectKey || '—' }}</TableCell>
              <TableCell class="text-muted-foreground">{{ formatDateTime(document.createdAt) }}</TableCell>
              <TableCell class="text-muted-foreground">{{ formatDateTime(document.updatedAt) }}</TableCell>
            </template>
          </TableRow>

          <TableRow v-if="!compact" class="hover:bg-transparent" :class="{ 'border-b-0': !isExpanded(document.id) }">
            <TableCell :colspan="columnCount" class="p-0 whitespace-normal">
              <div
                :id="`document-details-${document.id}`"
                class="grid transition-[grid-template-rows] duration-300 ease-out"
                :class="isExpanded(document.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                :inert="!isExpanded(document.id)"
              >
                <div class="overflow-hidden">
                  <div class="mb-2 flex flex-col gap-4 rounded-2xl bg-muted/50 px-10 py-4">
                    <div class="flex items-start justify-between gap-6">
                      <p v-if="document.summary" class="max-w-4xl text-sm leading-relaxed text-foreground">{{ document.summary }}</p>
                      <p v-else class="text-sm text-muted-foreground">No summary loaded.</p>
                      <Button variant="outline" size="sm" @click="emit('open', document)">
                        <PanelRightOpen />
                        Open document
                      </Button>
                    </div>

                    <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                      <dt class="font-medium text-muted-foreground">ID</dt>
                      <dd class="tabular-nums">{{ document.id }}</dd>
                      <dt class="font-medium text-muted-foreground">Author name</dt>
                      <dd class="break-all">{{ document.authorName || '—' }}</dd>
                      <dt class="font-medium text-muted-foreground">MCP write</dt>
                      <dd>{{ document.allowMcpWrite ? 'Allowed' : 'Not allowed' }}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
