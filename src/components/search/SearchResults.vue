<script setup>
import { reactive } from 'vue'
import { ChevronRight } from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateTime, formatEnum } from '@/lib/format'

defineProps({
  documents: { type: Array, required: true },
})

const enumColumns = [
  { field: 'kind', label: 'Kind' },
  { field: 'scope', label: 'Scope' },
  { field: 'type', label: 'Type' },
  { field: 'author', label: 'Author' },
  { field: 'memoryType', label: 'Memory type' },
]

const columnCount = enumColumns.length + 5

const expanded = reactive(new Set())

function toggle(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function relationGroups(document) {
  return [
    { label: 'Links to', relations: document.relations },
    { label: 'Referenced by', relations: document.referencedBy },
  ]
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <TableHead class="w-10"><span class="sr-only">Details</span></TableHead>
          <TableHead class="min-w-72">Name</TableHead>
          <TableHead v-for="column in enumColumns" :key="column.field">{{ column.label }}</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-for="document in documents" :key="document.id">
          <TableRow
            class="cursor-pointer"
            :class="{ 'border-b-0': expanded.has(document.id) }"
            @click="toggle(document.id)"
          >
            <TableCell>
              <button
                type="button"
                class="flex size-6 items-center justify-center rounded-md text-steel-gray hover:text-lavender-light focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                :aria-expanded="expanded.has(document.id)"
                :aria-controls="`document-details-${document.id}`"
                :aria-label="`Details of ${document.name || 'document ' + document.id}`"
                @click.stop="toggle(document.id)"
              >
                <ChevronRight class="size-4 transition-transform duration-300" :class="{ 'rotate-90': expanded.has(document.id) }" />
              </button>
            </TableCell>
            <TableCell class="font-medium whitespace-normal text-lavender-light">{{ document.name || 'Untitled' }}</TableCell>
            <TableCell v-for="column in enumColumns" :key="column.field">
              <Badge v-if="document[column.field]" :variant="column.field === 'kind' ? 'secondary' : 'outline'">
                {{ formatEnum(document[column.field]) }}
                <template v-if="column.field === 'type' && document.customExtension">({{ document.customExtension }})</template>
              </Badge>
              <span v-else class="text-muted-foreground">—</span>
            </TableCell>
            <TableCell>{{ document.projectKey || '—' }}</TableCell>
            <TableCell class="text-steel-gray">{{ formatDateTime(document.createdAt) }}</TableCell>
            <TableCell class="text-steel-gray">{{ formatDateTime(document.updatedAt) }}</TableCell>
          </TableRow>

          <TableRow class="hover:bg-transparent" :class="{ 'border-b-0': !expanded.has(document.id) }">
            <TableCell :colspan="columnCount" class="p-0 whitespace-normal">
              <div
                :id="`document-details-${document.id}`"
                class="grid transition-[grid-template-rows] duration-300 ease-out"
                :class="expanded.has(document.id) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
                :inert="!expanded.has(document.id)"
              >
                <div class="overflow-hidden">
                  <div class="flex flex-col gap-4 bg-deep-navy/60 px-12 py-4">
                    <p v-if="document.summary" class="max-w-4xl text-sm text-lavender">{{ document.summary }}</p>
                    <p v-else class="text-sm text-muted-foreground">No summary loaded.</p>

                    <pre
                      v-if="document.content"
                      class="max-h-64 max-w-4xl overflow-auto rounded-md bg-ink-black p-3 font-mono text-xs whitespace-pre-wrap text-steel-gray"
                    >{{ document.content }}</pre>

                    <dl class="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
                      <dt class="text-steel-gray">ID</dt>
                      <dd class="tabular-nums">{{ document.id }}</dd>
                      <dt class="text-steel-gray">Author name</dt>
                      <dd class="break-all">{{ document.authorName || '—' }}</dd>
                      <dt class="text-steel-gray">MCP write</dt>
                      <dd>{{ document.allowMcpWrite ? 'Allowed' : 'Not allowed' }}</dd>
                      <dt class="text-steel-gray">Relations</dt>
                      <dd>
                        <span v-if="!document.relations && !document.referencedBy" class="text-muted-foreground">
                          Not loaded (tick "Relations" in the search form)
                        </span>
                        <div v-else class="flex flex-col gap-1">
                          <div v-for="group in relationGroups(document)" :key="group.label" class="flex flex-wrap items-center gap-2">
                            <span class="text-steel-gray">{{ group.label }}:</span>
                            <template v-if="group.relations?.length">
                              <Badge v-for="relation in group.relations" :key="`${relation.type}-${relation.relatedDocumentId}`" variant="outline">
                                {{ formatEnum(relation.type) }} #{{ relation.relatedDocumentId }}
                              </Badge>
                            </template>
                            <span v-else class="text-muted-foreground">none</span>
                          </div>
                        </div>
                      </dd>
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
